"""Core gate-scan logic shared by the HTTP route and MQTT handler."""
import logging
from datetime import datetime, timezone

from services.firebase import get_db
from services.fare import calculate_fare
from services.mqtt_client import publish
from services.sse_bus import broadcast
from services.influx_client import write_slot_status

logger = logging.getLogger(__name__)


def process_booking_scan(booking_id: str) -> dict:
    """Handle a booking_id QR scan — used by guest bookings and legacy booking QRs.

    pending → entry (activate booking, open entry gate)
    active  → exit  (calculate fare, open exit gate)
    """
    db = get_db()
    doc = db.collection("bookings").document(booking_id).get()
    if not doc.exists:
        return {"action": "denied", "reason": "booking_not_found"}

    booking = doc.to_dict()
    status = booking.get("status")
    now = datetime.now(timezone.utc)
    slot_id = booking.get("slot_id")

    if status == "pending":
        doc.reference.update({"status": "active", "entry_time": now})
        if slot_id:
            db.collection("parking_slots").document(slot_id).update({"status": "occupied"})
            broadcast({"slot_id": slot_id, "status": "occupied"})
            write_slot_status(slot_id, "occupied")
        publish("parking/gate/entry/open", {"reason": "booking_activated"})
        logger.info("Gate entry — booking %s activated", booking_id)
        return {
            "action": "entry",
            "type": booking.get("type", "guest"),
            "booking_id": booking_id,
            "slot": booking.get("slot_number"),
            "message": "Booking activated — gate opening",
        }

    if status == "active":
        entry_time = booking.get("entry_time")
        if entry_time and entry_time.tzinfo is None:
            entry_time = entry_time.replace(tzinfo=timezone.utc)
        fare = calculate_fare(entry_time, now) if entry_time else 2.00
        doc.reference.update({"exit_time": now, "status": "completed", "fare_amount": fare})
        if slot_id:
            db.collection("parking_slots").document(slot_id).update({"status": "free"})
            broadcast({"slot_id": slot_id, "status": "free"})
            write_slot_status(slot_id, "free")
        publish("parking/gate/exit/open", {"reason": "exit_processed"})
        broadcast({"walk_in_completed": True, "booking_id": booking_id, "fare_amount": fare})
        logger.info("Gate exit — booking %s completed, fare $%.2f", booking_id, fare)
        return {
            "action": "exit",
            "type": booking.get("type", "guest"),
            "booking_id": booking_id,
            "slot": booking.get("slot_number"),
            "fare_amount": fare,
            "message": "Fare calculated — gate opening",
        }

    return {"action": "denied", "reason": f"booking_status_{status}"}


def _find_booking(db, user_id: str, status: str):
    docs = list(
        db.collection("bookings")
          .where("user_id", "==", user_id)
          .where("status", "==", status)
          .limit(1)
          .stream()
    )
    return docs[0] if docs else None


def _first_free_slot(db):
    docs = list(
        db.collection("parking_slots")
          .where("status", "==", "free")
          .limit(1)
          .stream()
    )
    return docs[0] if docs else None


def process_scan(user_id: str) -> dict:
    """
    Unified entry/exit logic for a user QR scan.

    Decision order:
      1. Pending booking  → activate (entry)
      2. Active booking   → complete (exit), calculate fare
      3. Free slot exists → create walk-in (entry)
      4. No slots         → deny
    """
    db = get_db()
    now = datetime.now(timezone.utc)

    # ── 1. Pending booking → entry ──────────────────────────────────────────
    pending = _find_booking(db, user_id, "pending")
    if pending:
        booking = pending.to_dict()
        slot_id = booking.get("slot_id")
        pending.reference.update({"status": "active", "entry_time": now})
        if slot_id:
            db.collection("parking_slots").document(slot_id).update({"status": "occupied"})
            broadcast({"slot_id": slot_id, "status": "occupied"})
            write_slot_status(slot_id, "occupied")
        publish("parking/gate/entry/open", {"reason": "booking_activated"})
        logger.info("Gate entry — booking %s activated (user %s)", pending.id, user_id)
        return {
            "action": "entry",
            "type": "booking",
            "booking_id": pending.id,
            "slot": booking.get("slot_number"),
            "message": "Booking activated — gate opening",
        }

    # ── 2. Active booking → exit ─────────────────────────────────────────────
    active = _find_booking(db, user_id, "active")
    if active:
        booking = active.to_dict()
        entry_time = booking.get("entry_time")
        if entry_time and entry_time.tzinfo is None:
            entry_time = entry_time.replace(tzinfo=timezone.utc)
        fare = calculate_fare(entry_time, now) if entry_time else 2.00

        slot_id = booking.get("slot_id")
        active.reference.update({"exit_time": now, "status": "completed", "fare_amount": fare})
        if slot_id:
            db.collection("parking_slots").document(slot_id).update({"status": "free"})
            broadcast({"slot_id": slot_id, "status": "free"})
            write_slot_status(slot_id, "free")

        publish("parking/gate/exit/open", {"reason": "exit_processed"})
        broadcast({
            "walk_in_completed": True,
            "booking_id": active.id,
            "fare_amount": fare,
            "user_id": user_id,
        })
        logger.info("Gate exit — booking %s completed, fare $%.2f (user %s)", active.id, fare, user_id)
        return {
            "action": "exit",
            "type": booking.get("type", "booking"),
            "booking_id": active.id,
            "slot": booking.get("slot_number"),
            "fare_amount": fare,
            "message": "Fare calculated — gate opening",
        }

    # ── 3. No booking → walk-in entry if slot available ──────────────────────
    slot_doc = _first_free_slot(db)
    if not slot_doc:
        logger.info("Gate scan denied — no free slots (user %s)", user_id)
        return {"action": "denied", "reason": "no_slots", "message": "No free slots available"}

    slot = slot_doc.to_dict()

    # Check if there's a future pending booking for this slot today (time-limit warning)
    today_str = now.strftime("%Y-%m-%d")
    future_bookings = list(
        db.collection("bookings")
          .where("slot_id", "==", slot_doc.id)
          .where("status", "==", "pending")
          .where("date", "==", today_str)
          .limit(1)
          .stream()
    )
    time_limit = None
    if future_bookings:
        fb = future_bookings[0].to_dict()
        time_limit = fb.get("start_time")  # e.g. "14:00"

    booking_ref = db.collection("bookings").document()
    booking_ref.set({
        "type": "walk_in",
        "user_id": user_id,
        "slot_id": slot_doc.id,
        "slot_number": slot.get("slot_number"),
        "status": "active",
        "entry_time": now,
        "exit_time": None,
        "fare_amount": None,
        "payment_status": "unpaid",
        "created_at": now,
        "time_limit": time_limit,
    })
    slot_doc.reference.update({"status": "occupied"})
    broadcast({"slot_id": slot_doc.id, "status": "occupied"})
    write_slot_status(slot_doc.id, "occupied")
    publish("parking/gate/entry/open", {"reason": "walk_in_created"})
    logger.info("Gate entry — walk-in %s created (user %s, slot %s%s)",
                booking_ref.id, user_id, slot_doc.id,
                f", must vacate by {time_limit}" if time_limit else "")

    response = {
        "action": "entry",
        "type": "walk_in",
        "booking_id": booking_ref.id,
        "slot": slot.get("slot_number"),
        "message": "Walk-in — gate opening",
    }
    if time_limit:
        response["time_limit"] = time_limit
        response["message"] = f"Walk-in — gate opening. Please vacate by {time_limit} (slot pre-booked)"
    return response

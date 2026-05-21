"""Core gate-scan logic — plate-number based QR system.

Walk-in QR   : encodes the plate number directly  (e.g. "1ABC234")
Booking QR   : encodes "B0" + plate               (e.g. "B01ABC234")

Exit flow (two-stage):
  1. process_scan  → calculates fare, stores pending exit, broadcasts SSE
  2. confirm_payment(plate) → marks completed, frees slot, opens gate via MQTT
"""
import logging
from datetime import datetime, timezone

from services.firebase import get_db
from services.fare import calculate_fare
from services.mqtt_client import publish
from services.sse_bus import broadcast
from services.influx_client import write_slot_status

logger = logging.getLogger(__name__)

# Pending exits waiting for payment: plate → {fare, booking_id, slot_id, slot_number}
_pending_exits: dict = {}


def _first_free_slot(db):
    docs = list(
        db.collection("parking_slots")
          .where("status", "==", "free")
          .limit(1)
          .stream()
    )
    return docs[0] if docs else None


def get_pending_exits() -> list:
    return [
        {"plate": plate, "fare_amount": v["fare"], "slot": v.get("slot_number")}
        for plate, v in _pending_exits.items()
    ]


def process_scan(scanned: str) -> dict:
    scanned = scanned.strip().upper()
    if scanned.startswith("B0"):
        return _process_booking(plate=scanned[2:])
    return _process_walkin(plate=scanned)


def confirm_payment(plate: str) -> dict:
    """Called after user confirms payment on website — completes exit and opens gate."""
    plate = plate.strip().upper()
    pending = _pending_exits.pop(plate, None)
    if pending is None:
        return {"error": "No pending payment for this plate"}

    fare       = pending["fare"]
    booking_id = pending["booking_id"]
    slot_id    = pending["slot_id"]

    db  = get_db()
    now = datetime.now(timezone.utc)
    db.collection("bookings").document(booking_id).update({
        "status":         "completed",
        "exit_time":      now,
        "fare_amount":    fare,
        "payment_status": "paid",
    })
    if slot_id:
        db.collection("parking_slots").document(slot_id).update({"status": "free"})
        broadcast({"slot_id": slot_id, "status": "free"})
        write_slot_status(slot_id, "free")

    publish("parking/gate/exit/open", {"reason": "payment_confirmed", "plate": plate})
    broadcast({"payment_confirmed": True, "plate": plate, "fare_amount": fare})
    logger.info("Payment confirmed — plate %s, fare $%.2f, gate opening", plate, fare)
    return {"action": "exit", "plate": plate, "fare_amount": fare, "message": "Gate opening"}


# ── Booking flow ─────────────────────────────────────────────────────────────

def _process_booking(plate: str) -> dict:
    db  = get_db()
    now = datetime.now(timezone.utc)

    # Active booking → pending exit (wait for payment)
    active = list(
        db.collection("bookings")
          .where("plate", "==", plate)
          .where("type", "==", "booking")
          .where("status", "==", "active")
          .limit(1).stream()
    )
    if active:
        doc = active[0]
        bk  = doc.to_dict()
        entry_time = bk.get("entry_time")
        if entry_time and entry_time.tzinfo is None:
            entry_time = entry_time.replace(tzinfo=timezone.utc)
        fare = calculate_fare(entry_time, now) if entry_time else 2.00

        doc.reference.update({"fare_amount": fare})
        _pending_exits[plate] = {
            "fare":        fare,
            "booking_id":  doc.id,
            "slot_id":     bk.get("slot_id"),
            "slot_number": bk.get("slot_number"),
        }
        broadcast({"payment_required": True, "plate": plate,
                   "fare_amount": fare, "slot": bk.get("slot_number")})
        logger.info("Booking exit pending payment — plate %s, fare $%.2f", plate, fare)
        return {
            "action":     "exit_pending",
            "type":       "booking",
            "plate":      plate,
            "slot":       bk.get("slot_number"),
            "fare_amount": fare,
            "message":    f"Fare ${fare:.2f} — awaiting payment on website",
        }

    # Pending booking → entry
    pending = list(
        db.collection("bookings")
          .where("plate", "==", plate)
          .where("type", "==", "booking")
          .where("status", "==", "pending")
          .limit(1).stream()
    )
    if pending:
        doc = pending[0]
        bk  = doc.to_dict()
        slot_id = bk.get("slot_id")
        doc.reference.update({"status": "active", "entry_time": now})
        if slot_id:
            db.collection("parking_slots").document(slot_id).update({"status": "occupied"})
            broadcast({"slot_id": slot_id, "status": "occupied"})
            write_slot_status(slot_id, "occupied")
        publish("parking/gate/entry/open", {"reason": "booking_entry", "plate": plate})
        logger.info("Booking entry — plate %s, slot %s", plate, bk.get("slot_number"))
        return {
            "action":  "entry",
            "type":    "booking",
            "plate":   plate,
            "slot":    bk.get("slot_number"),
            "message": "Booking activated — entry gate opening",
        }

    return {"action": "denied", "reason": "booking_not_found", "plate": plate,
            "message": "No booking found for this plate"}


# ── Walk-in flow ─────────────────────────────────────────────────────────────

def _process_walkin(plate: str) -> dict:
    db  = get_db()
    now = datetime.now(timezone.utc)

    # Active walk-in → pending exit (wait for payment)
    active = list(
        db.collection("bookings")
          .where("plate", "==", plate)
          .where("type", "==", "walk_in")
          .where("status", "==", "active")
          .limit(1).stream()
    )
    if active:
        doc = active[0]
        bk  = doc.to_dict()
        entry_time = bk.get("entry_time")
        if entry_time and entry_time.tzinfo is None:
            entry_time = entry_time.replace(tzinfo=timezone.utc)
        fare = calculate_fare(entry_time, now) if entry_time else 2.00

        doc.reference.update({"fare_amount": fare})
        _pending_exits[plate] = {
            "fare":        fare,
            "booking_id":  doc.id,
            "slot_id":     bk.get("slot_id"),
            "slot_number": bk.get("slot_number"),
        }
        broadcast({"payment_required": True, "plate": plate,
                   "fare_amount": fare, "slot": bk.get("slot_number")})
        logger.info("Walk-in exit pending payment — plate %s, fare $%.2f", plate, fare)
        return {
            "action":      "exit_pending",
            "type":        "walk_in",
            "plate":       plate,
            "slot":        bk.get("slot_number"),
            "fare_amount": fare,
            "message":     f"Fare ${fare:.2f} — awaiting payment on website",
        }

    # No active session → entry, assign slot
    slot_doc = _first_free_slot(db)
    if not slot_doc:
        return {"action": "denied", "reason": "no_slots", "message": "No free slots available"}

    slot = slot_doc.to_dict()
    booking_ref = db.collection("bookings").document()
    booking_ref.set({
        "type":           "walk_in",
        "plate":          plate,
        "user_id":        None,
        "slot_id":        slot_doc.id,
        "slot_number":    slot.get("slot_number"),
        "status":         "active",
        "entry_time":     now,
        "exit_time":      None,
        "fare_amount":    None,
        "payment_status": "unpaid",
        "created_at":     now,
    })
    slot_doc.reference.update({"status": "occupied"})
    broadcast({"slot_id": slot_doc.id, "status": "occupied"})
    write_slot_status(slot_doc.id, "occupied")
    publish("parking/gate/entry/open", {"reason": "walkin_entry", "plate": plate})
    logger.info("Walk-in entry — plate %s → slot %s", plate, slot.get("slot_number"))
    return {
        "action":     "entry",
        "type":       "walk_in",
        "plate":      plate,
        "slot":       slot.get("slot_number"),
        "booking_id": booking_ref.id,
        "message":    f"Walk-in entry — go to Slot {slot.get('slot_number')}",
    }

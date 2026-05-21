"""Guest booking — no account required. Uses plate-based QR (B0<plate>)."""
from flask import Blueprint, jsonify, request
from datetime import datetime, timezone
from services.firebase import get_db
from services.sse_bus import broadcast
from services.influx_client import write_slot_status
from services.qr_utils import generate_qr_base64
import logging

logger = logging.getLogger(__name__)
guest_bp = Blueprint("guest", __name__)


def _serialize(data: dict) -> dict:
    for field in ("entry_time", "exit_time", "created_at"):
        if data.get(field) and hasattr(data[field], "isoformat"):
            data[field] = data[field].isoformat()
    return data


@guest_bp.route("/book", methods=["POST"])
def guest_book():
    """Guest pre-booking — name + phone + plate, optionally a slot.

    If slot_id is provided the slot is reserved; otherwise the first free slot
    is auto-assigned. QR encodes "B0<plate>" so the gate can activate the booking.
    """
    data = request.get_json(silent=True) or {}
    name  = data.get("name",  "").strip()
    phone = data.get("phone", "").strip()
    plate = data.get("plate", "").strip().upper()
    slot_id = data.get("slot_id", "").strip()

    if not all([name, phone, plate]):
        return jsonify({"error": "name, phone, and plate are required"}), 400

    db = get_db()

    # Check plate doesn't already have a pending/active booking
    existing = list(
        db.collection("bookings")
          .where("plate", "==", plate)
          .where("status", "in", ["pending", "active"])
          .limit(1).stream()
    )
    if existing:
        return jsonify({"error": "This plate already has an active booking"}), 409

    # Resolve slot
    if slot_id:
        slot_doc = db.collection("parking_slots").document(slot_id).get()
        if not slot_doc.exists:
            return jsonify({"error": "Slot not found"}), 404
        if slot_doc.to_dict().get("status") != "free":
            return jsonify({"error": "Slot is no longer available"}), 409
    else:
        docs = list(
            db.collection("parking_slots")
              .where("status", "==", "free")
              .limit(1).stream()
        )
        if not docs:
            return jsonify({"error": "No free slots available"}), 409
        slot_doc = docs[0]
        slot_id = slot_doc.id

    slot = slot_doc.to_dict()
    now = datetime.now(timezone.utc)
    booking_code = f"B0{plate}"
    qr_code = generate_qr_base64(booking_code)

    booking_ref = db.collection("bookings").document()
    booking_ref.set({
        "type": "guest",
        "guest_name": name,
        "guest_phone": phone,
        "plate": plate,
        "booking_code": booking_code,
        "user_id": None,
        "slot_id": slot_id,
        "slot_number": slot.get("slot_number"),
        "status": "pending",
        "entry_time": None,
        "exit_time": None,
        "fare_amount": None,
        "payment_status": "unpaid",
        "created_at": now,
    })

    slot_doc.reference.update({"status": "reserved"})
    broadcast({"slot_id": slot_id, "status": "reserved"})
    write_slot_status(slot_id, "reserved")
    logger.info("Guest booking %s — plate %s, slot %s", booking_ref.id, plate, slot_id)

    return jsonify({
        "booking_id": booking_ref.id,
        "plate": plate,
        "booking_code": booking_code,
        "slot": slot.get("slot_number"),
        "name": name,
        "status": "pending",
        "qr_code": qr_code,
    }), 201


@guest_bp.route("/<booking_id>", methods=["GET"])
def get_guest_booking(booking_id):
    """Public — returns booking status (for kiosk / ticket page)."""
    db = get_db()
    doc = db.collection("bookings").document(booking_id).get()
    if not doc.exists:
        return jsonify({"error": "Not found"}), 404
    data = doc.to_dict()
    if data.get("type") not in ("guest", "walk_in"):
        return jsonify({"error": "Not a guest booking"}), 404
    return jsonify(_serialize({**data, "id": doc.id})), 200

from flask import Blueprint, jsonify, request
from datetime import datetime, timezone
from services.firebase import get_db
from services.sse_bus import broadcast
from services.influx_client import write_slot_status
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
    """Create a guest booking — no account required. Slot is reserved immediately."""
    data = request.get_json(silent=True) or {}
    name = data.get("name", "").strip()
    phone = data.get("phone", "").strip()
    slot_id = data.get("slot_id", "").strip()

    if not all([name, phone, slot_id]):
        return jsonify({"error": "name, phone, and slot_id are required"}), 400

    db = get_db()
    slot_doc = db.collection("parking_slots").document(slot_id).get()
    if not slot_doc.exists:
        return jsonify({"error": "Slot not found"}), 404
    slot = slot_doc.to_dict()
    if slot.get("status") != "free":
        return jsonify({"error": "Slot is no longer available"}), 409

    now = datetime.now(timezone.utc)
    booking_ref = db.collection("bookings").document()
    booking_ref.set({
        "type": "guest",
        "guest_name": name,
        "guest_phone": phone,
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
    logger.info("Guest booking %s created for '%s', slot %s", booking_ref.id, name, slot_id)

    return jsonify({
        "booking_id": booking_ref.id,
        "slot": slot.get("slot_number"),
        "name": name,
        "status": "pending",
    }), 201


@guest_bp.route("/<booking_id>", methods=["GET"])
def get_guest_booking(booking_id):
    """Public — returns guest booking status for the ticket page."""
    db = get_db()
    doc = db.collection("bookings").document(booking_id).get()
    if not doc.exists:
        return jsonify({"error": "Not found"}), 404
    data = doc.to_dict()
    if data.get("type") not in ("guest", "walk_in"):
        return jsonify({"error": "Not a guest booking"}), 404
    return jsonify(_serialize(data)), 200

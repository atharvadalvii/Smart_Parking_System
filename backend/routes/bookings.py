from flask import Blueprint, request, jsonify
from datetime import datetime, timezone
from services.firebase import get_db
from services.fare import calculate_fare
from services.mqtt_client import publish
from services.graph import shortest_path
from services.sse_bus import broadcast
from services.influx_client import write_slot_status
import logging
import qrcode
import io
import base64

logger = logging.getLogger(__name__)

bookings_bp = Blueprint("bookings", __name__)


def _slot_ref(db, slot_id):
    return db.collection("parking_slots").document(slot_id)


def _booking_ref(db, booking_id):
    return db.collection("bookings").document(booking_id)


def _generate_qr_base64(booking_id: str) -> str:
    """Generate a QR code encoding the booking_id. Returns base64 PNG string."""
    img = qrcode.make(booking_id)
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


def _serialize(data: dict) -> dict:
    for field in ("entry_time", "exit_time", "created_at"):
        if data.get(field) and hasattr(data[field], "isoformat"):
            data[field] = data[field].isoformat()
    return data


@bookings_bp.route("/", methods=["POST"])
def create_booking():
    data = request.get_json(silent=True) or {}
    user_id = data.get("user_id", "").strip()
    slot_id = data.get("slot_id", "").strip()

    if not all([user_id, slot_id]):
        return jsonify({"error": "user_id and slot_id are required"}), 400

    date = data.get("date", "")
    start_time = data.get("start_time", "")
    duration = data.get("duration")
    estimated_cost = data.get("estimated_cost")

    db = get_db()
    slot_doc = _slot_ref(db, slot_id).get()
    if not slot_doc.exists:
        return jsonify({"error": "Slot not found"}), 404
    if slot_doc.to_dict().get("status") != "free":
        return jsonify({"error": "Slot is not free"}), 409

    slot_number = slot_doc.to_dict().get("slot_number")
    booking_ref = db.collection("bookings").document()
    qr_code = _generate_qr_base64(booking_ref.id)

    booking_ref.set({
        "user_id": user_id,
        "slot_id": slot_id,
        "slot_number": slot_number,
        "date": date or None,
        "start_time": start_time or None,
        "duration": duration,
        "estimated_cost": estimated_cost,
        "qr_code": qr_code,
        "entry_time": None,
        "exit_time": None,
        "status": "pending",
        "fare_amount": None,
        "payment_status": "unpaid",
        "created_at": datetime.now(timezone.utc),
    })
    _slot_ref(db, slot_id).update({"status": "reserved"})
    broadcast({"slot_id": slot_id, "status": "reserved"})
    write_slot_status(slot_id, "reserved")

    return jsonify({
        "booking_id": booking_ref.id,
        "slot_id": slot_id,
        "slot_number": slot_number,
        "date": date or None,
        "start_time": start_time or None,
        "duration": duration,
        "estimated_cost": estimated_cost,
        "status": "pending",
        "qr_code": qr_code,
    }), 201


@bookings_bp.route("/<booking_id>", methods=["GET"])
def get_booking(booking_id):
    db = get_db()
    doc = _booking_ref(db, booking_id).get()
    if not doc.exists:
        return jsonify({"error": "Booking not found"}), 404
    return jsonify(_serialize({**doc.to_dict(), "id": doc.id})), 200


@bookings_bp.route("/user/<user_id>", methods=["GET"])
def user_bookings(user_id):
    db = get_db()
    docs = db.collection("bookings").where("user_id", "==", user_id).stream()
    results = [_serialize({**doc.to_dict(), "id": doc.id}) for doc in docs]
    return jsonify(results), 200


@bookings_bp.route("/<booking_id>/entry", methods=["PUT"])
def record_entry(booking_id):
    """Called when user scans QR code at entry gate."""
    db = get_db()
    ref = _booking_ref(db, booking_id)
    doc = ref.get()
    if not doc.exists:
        return jsonify({"error": "Booking not found"}), 404

    booking = doc.to_dict()
    if booking["status"] != "pending":
        return jsonify({"error": "Booking is not in pending status"}), 409

    entry_time = datetime.now(timezone.utc)
    ref.update({"entry_time": entry_time, "status": "active"})
    _slot_ref(db, booking["slot_id"]).update({"status": "occupied"})
    broadcast({"slot_id": booking["slot_id"], "status": "occupied"})
    write_slot_status(booking["slot_id"], "occupied")

    # Tell RPi to open the entry gate servo
    publish("parking/gate/entry/open", {
        "booking_id": booking_id,
        "slot_id": booking["slot_id"],
        "slot_number": booking.get("slot_number"),
    })

    # Publish Dijkstra path so RPi can light up LED guidance
    try:
        path = shortest_path(booking["slot_id"])
        publish("parking/path", {"slot_id": booking["slot_id"], "path": path})
    except Exception as exc:
        logger.warning("Could not compute path for slot %s: %s", booking["slot_id"], exc)

    return jsonify({
        "booking_id": booking_id,
        "slot_id": booking["slot_id"],
        "entry_time": entry_time.isoformat(),
        "status": "active",
    }), 200


@bookings_bp.route("/<booking_id>/exit", methods=["PUT"])
def record_exit(booking_id):
    """Called when user scans QR code at exit gate. Calculates fare."""
    db = get_db()
    ref = _booking_ref(db, booking_id)
    doc = ref.get()
    if not doc.exists:
        return jsonify({"error": "Booking not found"}), 404

    booking = doc.to_dict()
    if booking["status"] != "active":
        return jsonify({"error": "Booking is not active"}), 409
    if not booking.get("entry_time"):
        return jsonify({"error": "Entry time not recorded"}), 409

    exit_time = datetime.now(timezone.utc)
    entry_time = booking["entry_time"]
    if entry_time.tzinfo is None:
        entry_time = entry_time.replace(tzinfo=timezone.utc)

    fare = calculate_fare(entry_time, exit_time)

    ref.update({"exit_time": exit_time, "status": "completed", "fare_amount": fare})
    _slot_ref(db, booking["slot_id"]).update({"status": "free", "vehicle_plate": None})
    broadcast({"slot_id": booking["slot_id"], "status": "free"})
    write_slot_status(booking["slot_id"], "free")

    return jsonify({
        "booking_id": booking_id,
        "exit_time": exit_time.isoformat(),
        "fare_amount": fare,
        "status": "completed",
        "message": "Gate opens after payment is confirmed",
    }), 200


@bookings_bp.route("/<booking_id>", methods=["DELETE"])
def cancel_booking(booking_id):
    db = get_db()
    ref = _booking_ref(db, booking_id)
    doc = ref.get()
    if not doc.exists:
        return jsonify({"error": "Booking not found"}), 404

    booking = doc.to_dict()
    if booking["status"] == "completed":
        return jsonify({"error": "Cannot cancel a completed booking"}), 409

    ref.update({"status": "cancelled"})
    _slot_ref(db, booking["slot_id"]).update({"status": "free", "vehicle_plate": None})
    broadcast({"slot_id": booking["slot_id"], "status": "free"})
    write_slot_status(booking["slot_id"], "free")

    return jsonify({"booking_id": booking_id, "status": "cancelled"}), 200

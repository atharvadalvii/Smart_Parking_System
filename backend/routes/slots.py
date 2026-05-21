from flask import Blueprint, request, jsonify
from services.firebase import get_db

slots_bp = Blueprint("slots", __name__)

# Matches RGB LED colours in the report: Green=Free, Red=Occupied, Blue=Reserved
VALID_STATUSES = {"free", "occupied", "reserved"}


@slots_bp.route("/", methods=["GET"])
def list_slots():
    db = get_db()
    docs = db.collection("parking_slots").stream()
    slots = [{**doc.to_dict(), "id": doc.id} for doc in docs]
    return jsonify(slots), 200


@slots_bp.route("/<slot_id>", methods=["GET"])
def get_slot(slot_id):
    db = get_db()
    doc = db.collection("parking_slots").document(slot_id).get()
    if not doc.exists:
        return jsonify({"error": "Slot not found"}), 404
    return jsonify({**doc.to_dict(), "id": doc.id}), 200


@slots_bp.route("/<slot_id>/status", methods=["PUT"])
def update_slot_status(slot_id):
    """Called by ultrasonic sensor on Raspberry Pi to update physical slot state."""
    data = request.get_json(silent=True) or {}
    new_status = data.get("status", "")
    vehicle_plate = data.get("vehicle_plate")

    if new_status not in VALID_STATUSES:
        return jsonify({"error": f"status must be one of {sorted(VALID_STATUSES)}"}), 400

    db = get_db()
    ref = db.collection("parking_slots").document(slot_id)
    if not ref.get().exists:
        return jsonify({"error": "Slot not found"}), 404

    update = {"status": new_status}
    if vehicle_plate is not None:
        update["vehicle_plate"] = vehicle_plate

    ref.update(update)
    return jsonify({"slot_id": slot_id, "status": new_status}), 200


@slots_bp.route("/count", methods=["GET"])
def vehicle_count():
    """Returns vehicle count derived from occupied/reserved slot states."""
    db = get_db()
    slots_docs = db.collection("parking_slots").stream()
    count = sum(
        1 for s in slots_docs
        if s.to_dict().get("status") in ("occupied", "reserved")
    )
    return jsonify({"vehicle_count": count}), 200


@slots_bp.route("/count/entry", methods=["POST"])
def gate_entry():
    """IR sensor at entry gate triggers this — increments vehicle count."""
    db = get_db()
    ref = db.collection("system").document("vehicle_count")
    doc = ref.get()
    current = doc.to_dict().get("count", 0) if doc.exists else 0
    ref.set({"count": current + 1})
    return jsonify({"vehicle_count": current + 1}), 200


@slots_bp.route("/count/exit", methods=["POST"])
def gate_exit():
    """IR sensor at exit gate triggers this — decrements vehicle count."""
    db = get_db()
    ref = db.collection("system").document("vehicle_count")
    doc = ref.get()
    current = doc.to_dict().get("count", 0) if doc.exists else 0
    new_count = max(current - 1, 0)
    ref.set({"count": new_count})
    return jsonify({"vehicle_count": new_count}), 200

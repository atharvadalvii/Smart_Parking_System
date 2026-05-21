from flask import Blueprint, jsonify
from services.firebase import get_db

walkin_bp = Blueprint("walkin", __name__)


def _serialize(data: dict) -> dict:
    for field in ("entry_time", "exit_time", "created_at"):
        if data.get(field) and hasattr(data[field], "isoformat"):
            data[field] = data[field].isoformat()
    return data


@walkin_bp.route("/<booking_id>", methods=["GET"])
def get_walkin(booking_id):
    """Public endpoint — returns walk-in booking status for the driver's ticket page."""
    db = get_db()
    doc = db.collection("bookings").document(booking_id).get()
    if not doc.exists:
        return jsonify({"error": "Not found"}), 404
    data = doc.to_dict()
    if data.get("type") != "walk_in":
        return jsonify({"error": "Not a walk-in booking"}), 404
    return jsonify(_serialize(data)), 200

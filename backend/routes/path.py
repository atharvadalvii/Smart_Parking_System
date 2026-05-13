from flask import Blueprint, request, jsonify
from services.graph import shortest_path

path_bp = Blueprint("path", __name__)


@path_bp.route("/", methods=["GET"])
def get_path():
    slot_id = request.args.get("slot", "").strip().upper()
    if not slot_id:
        return jsonify({"error": "slot parameter is required"}), 400
    try:
        path = shortest_path(slot_id)
        return jsonify({"slot_id": slot_id, "path": path}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404

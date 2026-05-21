from flask import Blueprint, jsonify, request
from services.mqtt_client import publish
import logging

logger = logging.getLogger(__name__)
gate_bp = Blueprint("gate", __name__)

# Tracks which QR codes are currently "inside" (have entered but not yet exited)
_inside: set = set()


@gate_bp.route("/scan", methods=["POST"])
def scan():
    """
    First scan  → entry gate opens, QR marked as inside.
    Second scan → exit gate opens, QR cleared.
    Strictly alternates per QR value.
    """
    data = request.get_json(silent=True) or {}
    scanned = data.get("user_id", "").strip()
    if not scanned:
        return jsonify({"error": "user_id required"}), 400

    if scanned not in _inside:
        _inside.add(scanned)
        publish("parking/gate/entry/open", {"reason": "entry", "scanned": scanned})
        logger.info("Entry gate opened for QR: %s", scanned)
        return jsonify({"action": "entry", "message": "Entry gate opening"}), 200
    else:
        _inside.discard(scanned)
        publish("parking/gate/exit/open", {"reason": "exit", "scanned": scanned})
        logger.info("Exit gate opened for QR: %s", scanned)
        return jsonify({"action": "exit", "message": "Exit gate opening"}), 200

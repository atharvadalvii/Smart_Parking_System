from flask import Blueprint, jsonify, request
from services.gate_service import process_scan, confirm_payment, get_pending_exits
import logging

logger = logging.getLogger(__name__)
gate_bp = Blueprint("gate", __name__)


@gate_bp.route("/scan", methods=["POST"])
def scan():
    """RPi GM65 sends {"user_id": "<scanned_qr_value>"}.

    Entry → gate opens immediately.
    Exit  → returns fare, waits for /payment/confirm from website.
    """
    data    = request.get_json(silent=True) or {}
    scanned = (data.get("user_id") or data.get("plate") or data.get("qr_value") or "").strip()
    if not scanned:
        return jsonify({"error": "qr value required"}), 400

    result = process_scan(scanned)
    if result.get("action") == "denied":
        return jsonify(result), 409
    return jsonify(result), 200


@gate_bp.route("/pending-exits", methods=["GET"])
def pending_exits():
    """Returns all exits currently waiting for payment."""
    return jsonify(get_pending_exits()), 200


@gate_bp.route("/payment/confirm", methods=["POST"])
def payment_confirm():
    """Website calls this after user clicks 'Simulate Payment'.
    Completes the session, frees the slot, and opens the exit gate via MQTT.
    """
    data  = request.get_json(silent=True) or {}
    plate = (data.get("plate") or "").strip().upper()
    if not plate:
        return jsonify({"error": "plate is required"}), 400

    result = confirm_payment(plate)
    if "error" in result:
        return jsonify(result), 404
    return jsonify(result), 200

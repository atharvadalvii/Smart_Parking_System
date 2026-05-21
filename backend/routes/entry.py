"""Entry kiosk endpoint — vehicle detected → plate input → QR generated."""
from flask import Blueprint, jsonify, request
from services.qr_utils import generate_qr_base64
import logging

logger = logging.getLogger(__name__)
entry_bp = Blueprint("entry", __name__)


@entry_bp.route("/plate", methods=["POST"])
def plate_to_qr():
    """Kiosk submits the driver's number plate → returns a QR code for walk-in entry.

    The QR encodes the raw plate string. At the gate scanner, the plate is
    looked up and a session is created / completed automatically.
    """
    data = request.get_json(silent=True) or {}
    plate = (data.get("plate") or "").strip().upper()
    if not plate:
        return jsonify({"error": "plate is required"}), 400

    qr_code = generate_qr_base64(plate)
    logger.info("Entry kiosk QR generated for plate %s", plate)
    return jsonify({
        "plate": plate,
        "qr_value": plate,
        "qr_code": qr_code,
    }), 200

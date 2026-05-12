from flask import Blueprint, request, jsonify
from datetime import datetime, timezone
import stripe
from services.firebase import get_db
from services.stripe_service import create_payment_intent, construct_webhook_event
from services.fare import fare_to_cents

payments_bp = Blueprint("payments", __name__)


@payments_bp.route("/create-intent", methods=["POST"])
def create_intent():
    data = request.get_json(silent=True) or {}
    booking_id = data.get("booking_id", "").strip()

    if not booking_id:
        return jsonify({"error": "booking_id is required"}), 400

    db = get_db()
    booking_doc = db.collection("bookings").document(booking_id).get()
    if not booking_doc.exists:
        return jsonify({"error": "Booking not found"}), 404

    booking = booking_doc.to_dict()
    fare = booking.get("fare_amount")
    if fare is None:
        return jsonify({"error": "Fare not yet calculated — record exit first"}), 409
    if booking.get("payment_status") == "paid":
        return jsonify({"error": "Booking already paid"}), 409

    amount_cents = fare_to_cents(fare)
    intent = create_payment_intent(amount_cents, booking_id)

    payment_ref = db.collection("payments").document()
    payment_ref.set({
        "booking_id": booking_id,
        "stripe_payment_intent_id": intent.id,
        "amount": amount_cents,
        "currency": "aud",
        "status": "pending",
        "created_at": datetime.now(timezone.utc),
    })

    return jsonify({
        "client_secret": intent.client_secret,
        "payment_intent_id": intent.id,
        "amount_aud": fare,
    }), 201


@payments_bp.route("/webhook", methods=["POST"])
def webhook():
    payload = request.get_data()
    sig_header = request.headers.get("Stripe-Signature", "")

    try:
        event = construct_webhook_event(payload, sig_header)
    except ValueError:
        return jsonify({"error": "Invalid payload"}), 400
    except stripe.error.SignatureVerificationError:
        return jsonify({"error": "Invalid signature"}), 400

    if event["type"] == "payment_intent.succeeded":
        intent = event["data"]["object"]
        _handle_payment_succeeded(intent)

    return jsonify({"received": True}), 200


def _handle_payment_succeeded(intent):
    db = get_db()
    booking_id = intent.get("metadata", {}).get("booking_id")
    if not booking_id:
        return

    # Update payment document
    payments = (
        db.collection("payments")
        .where("stripe_payment_intent_id", "==", intent["id"])
        .limit(1)
        .get()
    )
    for p in payments:
        p.reference.update({"status": "succeeded"})

    # Mark booking as paid
    db.collection("bookings").document(booking_id).update({"payment_status": "paid"})


@payments_bp.route("/simulate/<booking_id>", methods=["POST"])
def simulate_payment(booking_id):
    """Demo-only: marks a booking as paid without going through Stripe."""
    db = get_db()
    booking_doc = db.collection("bookings").document(booking_id).get()
    if not booking_doc.exists:
        return jsonify({"error": "Booking not found"}), 404

    booking = booking_doc.to_dict()
    if booking.get("payment_status") == "paid":
        return jsonify({"error": "Already paid"}), 409

    fare = booking.get("fare_amount") or booking.get("estimated_cost") or 2.00

    payment_ref = db.collection("payments").document()
    payment_ref.set({
        "booking_id": booking_id,
        "stripe_payment_intent_id": f"sim_{payment_ref.id}",
        "amount": int(fare * 100),
        "currency": "aud",
        "status": "succeeded",
        "simulated": True,
        "created_at": datetime.now(timezone.utc),
    })

    db.collection("bookings").document(booking_id).update({
        "payment_status": "paid",
        "status": "completed",
    })

    return jsonify({
        "booking_id": booking_id,
        "amount_aud": fare,
        "payment_status": "paid",
        "status": "completed",
    }), 200


@payments_bp.route("/<booking_id>", methods=["GET"])
def get_payment_status(booking_id):
    db = get_db()
    payments = (
        db.collection("payments")
        .where("booking_id", "==", booking_id)
        .limit(1)
        .get()
    )
    if not payments:
        return jsonify({"error": "No payment found for this booking"}), 404

    p = payments[0].to_dict()
    p["id"] = payments[0].id
    if p.get("created_at") and hasattr(p["created_at"], "isoformat"):
        p["created_at"] = p["created_at"].isoformat()
    return jsonify(p), 200

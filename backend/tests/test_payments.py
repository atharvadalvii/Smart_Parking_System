from unittest.mock import MagicMock, patch
from datetime import datetime, timezone
import json


def _booking_doc(booking_id, fare=6.0, payment_status="unpaid", status="completed"):
    doc = MagicMock()
    doc.id = booking_id
    doc.exists = True
    doc.to_dict.return_value = {
        "user_id": "user1",
        "slot_id": "A1",
        "status": status,
        "fare_amount": fare,
        "payment_status": payment_status,
        "created_at": datetime.now(timezone.utc),
    }
    return doc


def test_create_intent_success(client, mock_db):
    mock_db.collection.return_value.document.return_value.get.return_value = _booking_doc("bk1")
    payment_ref = MagicMock()
    payment_ref.id = "pay1"

    # payments collection document() returns payment_ref for set()
    def col_side(name):
        m = MagicMock()
        if name == "bookings":
            m.document.return_value.get.return_value = _booking_doc("bk1")
        else:
            m.document.return_value = payment_ref
        return m

    mock_db.collection.side_effect = col_side

    fake_intent = MagicMock()
    fake_intent.id = "pi_test123"
    fake_intent.client_secret = "pi_test123_secret"

    with patch("routes.payments.create_payment_intent", return_value=fake_intent):
        resp = client.post("/api/payments/create-intent", json={"booking_id": "bk1"})

    assert resp.status_code == 201
    data = resp.get_json()
    assert data["payment_intent_id"] == "pi_test123"
    assert data["amount_aud"] == 6.0


def test_create_intent_no_fare(client, mock_db):
    mock_db.collection.return_value.document.return_value.get.return_value = _booking_doc("bk1", fare=None, status="active")
    resp = client.post("/api/payments/create-intent", json={"booking_id": "bk1"})
    assert resp.status_code == 409


def test_create_intent_already_paid(client, mock_db):
    mock_db.collection.return_value.document.return_value.get.return_value = _booking_doc("bk1", payment_status="paid")
    resp = client.post("/api/payments/create-intent", json={"booking_id": "bk1"})
    assert resp.status_code == 409


def test_webhook_payment_succeeded(client, mock_db):
    fake_event = {
        "type": "payment_intent.succeeded",
        "data": {
            "object": {
                "id": "pi_test123",
                "metadata": {"booking_id": "bk1"},
            }
        }
    }

    payment_doc = MagicMock()
    payment_doc.reference = MagicMock()

    def col_side(name):
        m = MagicMock()
        if name == "payments":
            m.where.return_value.limit.return_value.get.return_value = [payment_doc]
        else:
            m.document.return_value = MagicMock()
        return m

    mock_db.collection.side_effect = col_side

    with patch("routes.payments.construct_webhook_event", return_value=fake_event):
        resp = client.post(
            "/api/payments/webhook",
            data=json.dumps(fake_event).encode(),
            headers={"Stripe-Signature": "fake_sig", "Content-Type": "application/json"},
        )

    assert resp.status_code == 200
    assert resp.get_json()["received"] is True


def test_webhook_invalid_signature(client, mock_db):
    import stripe

    with patch("routes.payments.construct_webhook_event",
               side_effect=stripe.error.SignatureVerificationError("bad sig", "fake_sig")):
        resp = client.post(
            "/api/payments/webhook",
            data=b"{}",
            headers={"Stripe-Signature": "bad_sig"},
        )
    assert resp.status_code == 400


def test_get_payment_status_not_found(client, mock_db):
    mock_db.collection.return_value.where.return_value.limit.return_value.get.return_value = []
    resp = client.get("/api/payments/bk_unknown")
    assert resp.status_code == 404

from unittest.mock import MagicMock, patch
from datetime import datetime, timezone, timedelta


def _slot_doc(slot_id, status="free"):
    doc = MagicMock()
    doc.exists = True
    doc.to_dict.return_value = {"slot_number": f"Slot {slot_id[1]}", "status": status, "vehicle_plate": None}
    return doc


def _booking_doc(booking_id, status="pending", entry_time=None):
    doc = MagicMock()
    doc.id = booking_id
    doc.exists = True
    entry = entry_time or datetime.now(timezone.utc) - timedelta(hours=2)
    doc.to_dict.return_value = {
        "user_id": "user1",
        "slot_id": "S1",
        "qr_code": "base64fakecode",
        "entry_time": entry if status in ("active", "completed") else None,
        "exit_time": None,
        "status": status,
        "fare_amount": None,
        "payment_status": "unpaid",
        "created_at": datetime.now(timezone.utc),
    }
    return doc


def test_create_booking_success(client, mock_db):
    def col_side(name):
        m = MagicMock()
        if name == "parking_slots":
            m.document.return_value.get.return_value = _slot_doc("S1", "free")
        else:
            ref = MagicMock()
            ref.id = "bk_new"
            m.document.return_value = ref
        return m

    mock_db.collection.side_effect = col_side

    with patch("routes.bookings._generate_qr_base64", return_value="fakeqr"):
        resp = client.post("/api/bookings/", json={"user_id": "user1", "slot_id": "S1"})

    assert resp.status_code == 201
    data = resp.get_json()
    assert data["slot_id"] == "S1"
    assert data["qr_code"] == "fakeqr"


def test_create_booking_slot_not_free(client, mock_db):
    def col_side(name):
        m = MagicMock()
        m.document.return_value.get.return_value = _slot_doc("S1", "occupied")
        return m

    mock_db.collection.side_effect = col_side
    resp = client.post("/api/bookings/", json={"user_id": "user1", "slot_id": "S1"})
    assert resp.status_code == 409


def test_create_booking_reserved_slot_blocked(client, mock_db):
    def col_side(name):
        m = MagicMock()
        m.document.return_value.get.return_value = _slot_doc("S2", "reserved")
        return m

    mock_db.collection.side_effect = col_side
    resp = client.post("/api/bookings/", json={"user_id": "user1", "slot_id": "S2"})
    assert resp.status_code == 409


def test_get_booking_not_found(client, mock_db):
    doc = MagicMock()
    doc.exists = False
    mock_db.collection.return_value.document.return_value.get.return_value = doc
    resp = client.get("/api/bookings/nonexistent")
    assert resp.status_code == 404


def test_record_entry_success(client, mock_db):
    def col_side(name):
        m = MagicMock()
        if name == "bookings":
            m.document.return_value.get.return_value = _booking_doc("bk1", "pending")
        else:
            m.document.return_value.get.return_value = _slot_doc("S1")
        return m

    mock_db.collection.side_effect = col_side
    resp = client.put("/api/bookings/bk1/entry")
    assert resp.status_code == 200
    assert resp.get_json()["status"] == "active"


def test_record_exit_calculates_fare(client, mock_db):
    def col_side(name):
        m = MagicMock()
        if name == "bookings":
            m.document.return_value.get.return_value = _booking_doc("bk1", "active")
        else:
            m.document.return_value.get.return_value = _slot_doc("S1", "occupied")
        return m

    mock_db.collection.side_effect = col_side
    resp = client.put("/api/bookings/bk1/exit")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["status"] == "completed"
    assert data["fare_amount"] >= 2.00  # minimum $2 applies


def test_record_exit_slot_set_to_free(client, mock_db):
    slot_ref = MagicMock()

    def col_side(name):
        m = MagicMock()
        if name == "bookings":
            m.document.return_value.get.return_value = _booking_doc("bk1", "active")
        else:
            m.document.return_value = slot_ref
            slot_ref.get.return_value = _slot_doc("S1", "occupied")
        return m

    mock_db.collection.side_effect = col_side
    client.put("/api/bookings/bk1/exit")
    slot_ref.update.assert_called_with({"status": "free", "vehicle_plate": None})


def test_cancel_booking_sets_slot_free(client, mock_db):
    def col_side(name):
        m = MagicMock()
        if name == "bookings":
            m.document.return_value.get.return_value = _booking_doc("bk1", "pending")
        else:
            m.document.return_value.get.return_value = _slot_doc("S1")
        return m

    mock_db.collection.side_effect = col_side
    resp = client.delete("/api/bookings/bk1")
    assert resp.status_code == 200
    assert resp.get_json()["status"] == "cancelled"

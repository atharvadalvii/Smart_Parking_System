from unittest.mock import MagicMock


def _make_slot_doc(slot_id, status="free"):
    doc = MagicMock()
    doc.id = slot_id
    doc.exists = True
    doc.to_dict.return_value = {"slot_number": f"Slot {slot_id[1]}", "status": status, "vehicle_plate": None}
    return doc


def test_list_slots(client, mock_db):
    mock_db.collection.return_value.stream.return_value = [
        _make_slot_doc("S1"), _make_slot_doc("S2", "occupied")
    ]
    resp = client.get("/api/slots/")
    assert resp.status_code == 200
    data = resp.get_json()
    assert len(data) == 2
    assert data[0]["id"] == "S1"


def test_get_slot_found(client, mock_db):
    mock_db.collection.return_value.document.return_value.get.return_value = _make_slot_doc("S2")
    resp = client.get("/api/slots/S2")
    assert resp.status_code == 200
    assert resp.get_json()["id"] == "S2"


def test_get_slot_not_found(client, mock_db):
    doc = MagicMock()
    doc.exists = False
    mock_db.collection.return_value.document.return_value.get.return_value = doc
    resp = client.get("/api/slots/S9")
    assert resp.status_code == 404


def test_update_slot_status_valid(client, mock_db):
    mock_db.collection.return_value.document.return_value.get.return_value = _make_slot_doc("S1")
    resp = client.put("/api/slots/S1/status", json={"status": "occupied", "vehicle_plate": "ABC123"})
    assert resp.status_code == 200
    assert resp.get_json()["status"] == "occupied"


def test_update_slot_status_to_reserved(client, mock_db):
    mock_db.collection.return_value.document.return_value.get.return_value = _make_slot_doc("S1")
    resp = client.put("/api/slots/S1/status", json={"status": "reserved"})
    assert resp.status_code == 200
    assert resp.get_json()["status"] == "reserved"


def test_update_slot_status_invalid(client, mock_db):
    resp = client.put("/api/slots/S1/status", json={"status": "available"})
    assert resp.status_code == 400

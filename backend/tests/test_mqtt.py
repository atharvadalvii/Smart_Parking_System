"""Tests for the MQTT subscriber service."""
import json
from unittest.mock import MagicMock, patch, call

import pytest

from services.mqtt_client import (
    _parse_payload,
    _handle_slot,
    _handle_gate_entry,
    _handle_gate_exit,
    _on_connect,
    _on_message,
    start_mqtt_client,
)


# ---------------------------------------------------------------------------
# _parse_payload
# ---------------------------------------------------------------------------

def test_parse_payload_json():
    payload = json.dumps({"distance": 10}).encode()
    assert _parse_payload(payload) == {"distance": 10}


def test_parse_payload_plain_string():
    assert _parse_payload(b"occupied") == {"status": "occupied"}


def test_parse_payload_plain_string_trimmed():
    assert _parse_payload(b"  free  ") == {"status": "free"}


# ---------------------------------------------------------------------------
# _handle_slot — distance-based detection
# ---------------------------------------------------------------------------

def _mock_slot_doc(status="free"):
    doc = MagicMock()
    doc.exists = True
    doc.to_dict.return_value = {"status": status}
    return doc


def test_slot_occupied_from_distance(mock_db):
    mock_db.collection().document().get.return_value = _mock_slot_doc("free")
    _handle_slot("1", {"distance": 10})
    mock_db.collection().document().update.assert_called_once_with({"status": "occupied"})


def test_slot_free_from_distance(mock_db):
    mock_db.collection().document().get.return_value = _mock_slot_doc("occupied")
    _handle_slot("2", {"distance": 20})
    mock_db.collection().document().update.assert_called_once_with({"status": "free"})


def test_slot_occupied_from_status_field(mock_db):
    mock_db.collection().document().get.return_value = _mock_slot_doc("free")
    _handle_slot("3", {"status": "occupied"})
    mock_db.collection().document().update.assert_called_once_with({"status": "occupied"})


def test_slot_reserved_not_overwritten_by_sensor_free(mock_db):
    """Sensor sees 'free' but slot is reserved — booking should not be cancelled."""
    mock_db.collection().document().get.return_value = _mock_slot_doc("reserved")
    _handle_slot("1", {"distance": 50})
    mock_db.collection().document().update.assert_not_called()


def test_slot_reserved_updated_to_occupied_when_car_arrives(mock_db):
    """Car arrives in reserved slot — sensor triggers occupied, update should go through."""
    mock_db.collection().document().get.return_value = _mock_slot_doc("reserved")
    _handle_slot("1", {"distance": 8})
    mock_db.collection().document().update.assert_called_once_with({"status": "occupied"})


def test_slot_unknown_status_ignored(mock_db):
    mock_db.collection().document().get.return_value = _mock_slot_doc("free")
    _handle_slot("1", {"status": "unknown_value"})
    mock_db.collection().document().update.assert_not_called()


def test_slot_not_found_in_firestore(mock_db):
    doc = MagicMock()
    doc.exists = False
    mock_db.collection().document().get.return_value = doc
    _handle_slot("1", {"distance": 5})
    mock_db.collection().document().update.assert_not_called()


# ---------------------------------------------------------------------------
# _handle_gate_entry / _handle_gate_exit
# ---------------------------------------------------------------------------

def test_gate_entry_increments_count(mock_db):
    doc = MagicMock()
    doc.exists = True
    doc.to_dict.return_value = {"count": 2}
    mock_db.collection().document().get.return_value = doc
    _handle_gate_entry({})
    mock_db.collection().document().set.assert_called_once_with({"count": 3})


def test_gate_exit_decrements_count(mock_db):
    doc = MagicMock()
    doc.exists = True
    doc.to_dict.return_value = {"count": 2}
    mock_db.collection().document().get.return_value = doc
    _handle_gate_exit({})
    mock_db.collection().document().set.assert_called_once_with({"count": 1})


def test_gate_exit_does_not_go_below_zero(mock_db):
    doc = MagicMock()
    doc.exists = True
    doc.to_dict.return_value = {"count": 0}
    mock_db.collection().document().get.return_value = doc
    _handle_gate_exit({})
    mock_db.collection().document().set.assert_called_once_with({"count": 0})


# ---------------------------------------------------------------------------
# _on_connect — subscribes to correct topics
# ---------------------------------------------------------------------------

def test_on_connect_subscribes_to_topics():
    client = MagicMock()
    _on_connect(client, None, None, rc=0)
    calls = [c[0][0] for c in client.subscribe.call_args_list]
    assert "parking/slot/+" in calls
    assert "parking/gate/entry" in calls
    assert "parking/gate/exit" in calls


def test_on_connect_failed_does_not_subscribe():
    client = MagicMock()
    _on_connect(client, None, None, rc=1)
    client.subscribe.assert_not_called()


# ---------------------------------------------------------------------------
# _on_message — routes to correct handler
# ---------------------------------------------------------------------------

def test_on_message_routes_slot(mock_db):
    mock_db.collection().document().get.return_value = _mock_slot_doc("free")
    msg = MagicMock()
    msg.topic = "parking/slot/2"
    msg.payload = json.dumps({"distance": 8}).encode()
    _on_message(None, None, msg)
    mock_db.collection().document().update.assert_called_once_with({"status": "occupied"})


def test_on_message_routes_gate_entry(mock_db):
    doc = MagicMock()
    doc.exists = True
    doc.to_dict.return_value = {"count": 1}
    mock_db.collection().document().get.return_value = doc
    msg = MagicMock()
    msg.topic = "parking/gate/entry"
    msg.payload = b"{}"
    _on_message(None, None, msg)
    mock_db.collection().document().set.assert_called_once_with({"count": 2})


def test_on_message_routes_gate_exit(mock_db):
    doc = MagicMock()
    doc.exists = True
    doc.to_dict.return_value = {"count": 3}
    mock_db.collection().document().get.return_value = doc
    msg = MagicMock()
    msg.topic = "parking/gate/exit"
    msg.payload = b"{}"
    _on_message(None, None, msg)
    mock_db.collection().document().set.assert_called_once_with({"count": 2})


# ---------------------------------------------------------------------------
# start_mqtt_client — skips when broker not configured
# ---------------------------------------------------------------------------

def test_start_mqtt_client_skips_when_no_broker():
    with patch("services.mqtt_client.config") as mock_config:
        mock_config.MQTT_BROKER = ""
        with patch("paho.mqtt.client.Client") as MockClient:
            start_mqtt_client()
            MockClient.assert_not_called()


def test_start_mqtt_client_connects_when_broker_set():
    with patch("services.mqtt_client.config") as mock_config:
        mock_config.MQTT_BROKER = "localhost"
        mock_config.MQTT_PORT = 1883
        mock_config.MQTT_USERNAME = ""
        mock_config.MQTT_PASSWORD = ""
        with patch("paho.mqtt.client.Client") as MockClient:
            with patch("threading.Thread") as MockThread:
                start_mqtt_client()
                MockClient.return_value.connect.assert_called_once_with("localhost", 1883, keepalive=60)
                MockThread.return_value.start.assert_called_once()

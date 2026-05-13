import json
import logging
import os
import threading

import paho.mqtt.client as mqtt

import config
from services.firebase import get_db
from services.sse_bus import broadcast
from services.influx_client import write_slot_status, write_vehicle_count

logger = logging.getLogger(__name__)

OCCUPANCY_THRESHOLD_CM = 15  # distance below this means a car is present


# ---------------------------------------------------------------------------
# Payload helpers
# ---------------------------------------------------------------------------

def _parse_payload(payload: bytes) -> dict:
    """Accept JSON or a plain status string."""
    try:
        return json.loads(payload.decode())
    except (json.JSONDecodeError, UnicodeDecodeError):
        text = payload.decode(errors="ignore").strip().lower()
        return {"status": text}


# ---------------------------------------------------------------------------
# Message handlers
# ---------------------------------------------------------------------------

def _handle_slot(slot_num: str, data: dict):
    """Update Firestore slot status from sensor reading."""
    db = get_db()
    slot_id = f"S{slot_num}"

    # Resolve status from distance value or explicit status field
    if "distance" in data:
        status = "occupied" if float(data["distance"]) < OCCUPANCY_THRESHOLD_CM else "free"
    elif "status" in data:
        status = data["status"].lower()
        if status not in ("free", "occupied", "reserved"):
            logger.warning("Slot %s: unknown status '%s' — ignored", slot_id, status)
            return
    else:
        logger.warning("Slot %s: unrecognised payload %s — ignored", slot_id, data)
        return

    doc = db.collection("parking_slots").document(slot_id).get()
    if not doc.exists:
        logger.warning("Slot %s not found in Firestore", slot_id)
        return

    current = doc.to_dict().get("status")

    # Don't let a sensor "free" reading erase a pending booking reservation
    if current == "reserved" and status == "free":
        logger.debug("Slot %s is reserved — ignoring sensor 'free' reading", slot_id)
        return

    db.collection("parking_slots").document(slot_id).update({"status": status})
    broadcast({"slot_id": slot_id, "status": status})
    write_slot_status(slot_id, status)
    logger.info("Slot %s: %s → %s", slot_id, current, status)


def _handle_gate_entry(_data: dict):
    """IR sensor at entry gate fired — increment vehicle count."""
    db = get_db()
    ref = db.collection("system").document("vehicle_count")
    doc = ref.get()
    current = doc.to_dict().get("count", 0) if doc.exists else 0
    ref.set({"count": current + 1})
    write_vehicle_count(current + 1)
    logger.info("Gate entry — vehicle count: %d", current + 1)


def _handle_gate_exit(_data: dict):
    """IR sensor at exit gate fired — decrement vehicle count."""
    db = get_db()
    ref = db.collection("system").document("vehicle_count")
    doc = ref.get()
    current = doc.to_dict().get("count", 0) if doc.exists else 0
    new_count = max(current - 1, 0)
    ref.set({"count": new_count})
    write_vehicle_count(new_count)
    logger.info("Gate exit — vehicle count: %d", new_count)


# ---------------------------------------------------------------------------
# MQTT callbacks
# ---------------------------------------------------------------------------

def _on_connect(client, _userdata, _flags, rc):
    if rc == 0:
        client.subscribe("parking/slot/+")
        client.subscribe("parking/gate/entry")
        client.subscribe("parking/gate/exit")
        logger.info("MQTT connected — subscribed to parking/# topics")
    else:
        logger.error("MQTT connection refused (rc=%d)", rc)


def _on_message(_client, _userdata, msg):
    topic = msg.topic
    data = _parse_payload(msg.payload)
    logger.debug("MQTT ← %s : %s", topic, data)

    try:
        if topic.startswith("parking/slot/"):
            slot_num = topic.split("/")[-1]
            _handle_slot(slot_num, data)
        elif topic == "parking/gate/entry":
            _handle_gate_entry(data)
        elif topic == "parking/gate/exit":
            _handle_gate_exit(data)
    except Exception as exc:
        logger.error("Error handling MQTT message on %s: %s", topic, exc)


# ---------------------------------------------------------------------------
# Publisher — backend → RPi
# ---------------------------------------------------------------------------

_client = None  # shared client instance for publishing


def publish(topic: str, payload: dict):
    """Publish a JSON message to the broker.

    Topics the RPi listens for:
      parking/gate/entry/open  — open entry gate servo after QR verified
      parking/gate/exit/open   — open exit gate servo after payment confirmed
      parking/path             — LED path sequence after entry (for Dijkstra)
    """
    if _client is None:
        logger.debug("MQTT not connected — skipping publish to %s", topic)
        return
    _client.publish(topic, json.dumps(payload))
    logger.info("MQTT → %s : %s", topic, payload)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def start_mqtt_client():
    """Connect to the broker and start the network loop in a daemon thread.

    Does nothing if MQTT_BROKER is not configured — safe to call in any env.
    """
    if not config.MQTT_BROKER:
        logger.info("MQTT_BROKER not set — MQTT subscriber disabled")
        return

    client = mqtt.Client()

    if config.MQTT_USERNAME:
        client.username_pw_set(config.MQTT_USERNAME, config.MQTT_PASSWORD)

    client.on_connect = _on_connect
    client.on_message = _on_message

    try:
        client.connect(config.MQTT_BROKER, config.MQTT_PORT, keepalive=60)
        global _client
        _client = client
        thread = threading.Thread(target=client.loop_forever, daemon=True)
        thread.start()
        logger.info("MQTT client started → %s:%d", config.MQTT_BROKER, config.MQTT_PORT)
    except Exception as exc:
        logger.warning("MQTT client could not connect (%s) — running without MQTT", exc)

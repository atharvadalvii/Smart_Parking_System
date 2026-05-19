"""MQTT client for the RPi — publishes sensor data, receives gate commands."""
import json
import logging
import threading

import paho.mqtt.client as mqtt

import config

logger = logging.getLogger(__name__)

_client = None

# Callbacks registered by other modules
_on_gate_entry_open = None   # called when backend says open entry gate
_on_gate_exit_open  = None   # called when backend says open exit gate
_on_path_update     = None   # called with waypoint list for LED strip


def register_callbacks(gate_entry_open=None, gate_exit_open=None, path_update=None):
    global _on_gate_entry_open, _on_gate_exit_open, _on_path_update
    _on_gate_entry_open = gate_entry_open
    _on_gate_exit_open  = gate_exit_open
    _on_path_update     = path_update


def _on_connect(client, _userdata, _flags, rc):
    if rc == 0:
        client.subscribe("parking/gate/entry/open")
        client.subscribe("parking/gate/exit/open")
        client.subscribe("parking/path")
        logger.info("MQTT connected — subscribed to backend command topics")
    else:
        logger.error("MQTT connection refused (rc=%d)", rc)


def _on_message(_client, _userdata, msg):
    try:
        data = json.loads(msg.payload.decode())
    except Exception:
        data = {}

    logger.debug("MQTT ← %s : %s", msg.topic, data)

    if msg.topic == "parking/gate/entry/open" and _on_gate_entry_open:
        _on_gate_entry_open(data)
    elif msg.topic == "parking/gate/exit/open" and _on_gate_exit_open:
        _on_gate_exit_open(data)
    elif msg.topic == "parking/path" and _on_path_update:
        _on_path_update(data.get("path", []))


def publish(topic: str, payload: dict):
    if _client is None:
        logger.warning("MQTT not connected — cannot publish to %s", topic)
        return
    _client.publish(topic, json.dumps(payload))
    logger.debug("MQTT → %s : %s", topic, payload)


def publish_slot(slot_num: str, distance_cm: float):
    publish(f"parking/slot/{slot_num}", {"distance": round(distance_cm, 1)})


def publish_gate_entry():
    publish("parking/gate/entry", {})


def publish_gate_exit():
    publish("parking/gate/exit", {})


def start():
    global _client
    client = mqtt.Client()

    if config.MQTT_USERNAME:
        client.username_pw_set(config.MQTT_USERNAME, config.MQTT_PASSWORD)

    client.on_connect = _on_connect
    client.on_message = _on_message

    try:
        client.connect(config.MQTT_BROKER, config.MQTT_PORT, keepalive=60)
        _client = client
        thread = threading.Thread(target=client.loop_forever, daemon=True)
        thread.start()
        logger.info("MQTT client started → %s:%d", config.MQTT_BROKER, config.MQTT_PORT)
    except Exception as exc:
        logger.error("MQTT could not connect: %s", exc)

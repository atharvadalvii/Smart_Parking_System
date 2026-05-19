#!/usr/bin/env python3
"""RPi entry point — wires all hardware modules together."""
import logging
import signal
import threading
import sys

import RPi.GPIO as GPIO

import config
import gate
import lcd
import leds
import mqtt_client
import qr_scanner
import sensors

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger(__name__)

_stop = threading.Event()


# ── MQTT command handlers ────────────────────────────────────────────────────

def _on_entry_open(data: dict):
    gate.on_entry_open(data)
    slot_num = data.get("slot_number", "")
    lcd.show_welcome(slot_num)
    lcd.show_gate_message("entry", "Gate Open!")


def _on_exit_open(data: dict):
    gate.on_exit_open(data)
    fare = data.get("amount_aud", 0)
    lcd.show_farewell(fare)
    lcd.show_gate_message("exit", "Gate Open!")


def _on_path(waypoints: list):
    leds.show_path(waypoints)


# ── Shutdown ────────────────────────────────────────────────────────────────

def _shutdown(signum, _frame):
    logger.info("Shutting down (signal %d)…", signum)
    _stop.set()


def _cleanup():
    gate.cleanup()
    leds.cleanup()
    lcd.cleanup()
    GPIO.cleanup()
    logger.info("GPIO cleaned up")


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    signal.signal(signal.SIGINT,  _shutdown)
    signal.signal(signal.SIGTERM, _shutdown)

    GPIO.setmode(GPIO.BCM)
    GPIO.setwarnings(False)

    # Start hardware modules
    lcd.start()
    leds.start()
    gate.start()

    # Register MQTT command callbacks before connecting
    mqtt_client.register_callbacks(
        gate_entry_open=_on_entry_open,
        gate_exit_open=_on_exit_open,
        path_update=_on_path,
    )
    mqtt_client.start()

    # Start sensor polling (publishes distance to MQTT every SENSOR_INTERVAL_S)
    sensors.start(_stop)

    # Start QR scanners (one per gate — uses same USB device, different gate label)
    qr_scanner.start("entry", _stop)
    qr_scanner.start("exit",  _stop)

    logger.info("Smart Parking RPi ready")
    lcd.show_slot_summary({"S1": "free", "S2": "free", "S3": "free"})

    _stop.wait()   # block until SIGINT / SIGTERM
    _cleanup()
    sys.exit(0)


if __name__ == "__main__":
    main()

"""HC-SR04 ultrasonic sensor loop — one thread per slot."""
import logging
import threading
import time

import RPi.GPIO as GPIO

import config
import leds
import mqtt_client

logger = logging.getLogger(__name__)


def _measure_distance(trig: int, echo: int) -> float:
    """Return distance in cm. Returns -1 on timeout."""
    GPIO.output(trig, False)
    time.sleep(0.05)

    GPIO.output(trig, True)
    time.sleep(0.00001)
    GPIO.output(trig, False)

    timeout = time.time() + 0.04   # 40 ms max round-trip

    pulse_start = time.time()
    while GPIO.input(echo) == 0:
        pulse_start = time.time()
        if time.time() > timeout:
            return -1

    pulse_end = time.time()
    while GPIO.input(echo) == 1:
        pulse_end = time.time()
        if time.time() > timeout:
            return -1

    return (pulse_end - pulse_start) * 17150


def _slot_loop(slot_num: str, trig: int, echo: int, stop_event: threading.Event):
    GPIO.setup(trig, GPIO.OUT)
    GPIO.setup(echo, GPIO.IN)
    logger.info("Slot %s sensor started (TRIG=%d ECHO=%d)", slot_num, trig, echo)

    last_status = None
    while not stop_event.is_set():
        dist = _measure_distance(trig, echo)
        if dist > 0:
            status = "occupied" if dist < config.OCCUPANCY_THRESHOLD_CM else "free"
            mqtt_client.publish_slot(slot_num, dist)
            logger.debug("Slot %s: %.1f cm → %s", slot_num, dist, status)
            if status != last_status:
                leds.set_slot_led(f"S{slot_num}", status)
                last_status = status
        stop_event.wait(config.SENSOR_INTERVAL_S)


def start(stop_event: threading.Event):
    """Start one polling thread per slot."""
    for slot_num, pins in config.ULTRASONIC.items():
        t = threading.Thread(
            target=_slot_loop,
            args=(slot_num, pins["trig"], pins["echo"], stop_event),
            daemon=True,
            name=f"sensor-S{slot_num}",
        )
        t.start()
    logger.info("Ultrasonic sensor threads started for %d slots", len(config.ULTRASONIC))

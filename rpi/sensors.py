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


def _exit_gate_loop(trig: int, echo: int, stop_event: threading.Event):
    """Poll exit gate ultrasonic — publish gate/exit when car arrives, once per presence."""
    GPIO.setup(trig, GPIO.OUT)
    GPIO.setup(echo, GPIO.IN)
    logger.info("Exit gate ultrasonic started (TRIG=%d ECHO=%d)", trig, echo)
    car_present = False
    while not stop_event.is_set():
        dist = _measure_distance(trig, echo)
        detected = 0 < dist < config.OCCUPANCY_THRESHOLD_CM
        if detected and not car_present:
            car_present = True
            mqtt_client.publish_gate_exit()
            logger.info("Exit gate: car detected (%.1f cm)", dist)
        elif not detected and car_present:
            car_present = False
        stop_event.wait(0.5)


def _entry_gate_loop(stop_event: threading.Event):
    """Poll VL53L1X laser at entry gate — publish gate/entry when car arrives."""
    try:
        import board
        import busio
        import adafruit_vl53l1x
        i2c = busio.I2C(board.SCL, board.SDA)
        sensor = adafruit_vl53l1x.VL53L1X(i2c)
        sensor.start_ranging()
        logger.info("VL53L1X entry gate sensor ready (I2C 0x%02X)", config.VL53L1X_I2C_ADDRESS)
    except Exception as exc:
        logger.warning("VL53L1X entry gate not available: %s", exc)
        return

    car_present = False
    while not stop_event.is_set():
        try:
            if sensor.data_ready:
                dist = sensor.distance
                sensor.clear_interrupt()
                if dist is not None:
                    detected = dist < config.OCCUPANCY_THRESHOLD_CM
                    if detected and not car_present:
                        car_present = True
                        mqtt_client.publish_gate_entry()
                        logger.info("Entry gate: car detected (%.1f cm)", dist)
                    elif not detected and car_present:
                        car_present = False
        except Exception as exc:
            logger.error("VL53L1X read error: %s", exc)
        stop_event.wait(0.3)


def start(stop_event: threading.Event):
    """Start one polling thread per slot plus exit gate ultrasonic."""
    for slot_num, pins in config.ULTRASONIC.items():
        t = threading.Thread(
            target=_slot_loop,
            args=(slot_num, pins["trig"], pins["echo"], stop_event),
            daemon=True,
            name=f"sensor-S{slot_num}",
        )
        t.start()

    pins = config.ULTRASONIC_EXIT_GATE
    threading.Thread(
        target=_exit_gate_loop,
        args=(pins["trig"], pins["echo"], stop_event),
        daemon=True,
        name="sensor-exit-gate",
    ).start()

    threading.Thread(
        target=_entry_gate_loop,
        args=(stop_event,),
        daemon=True,
        name="sensor-entry-gate",
    ).start()

    logger.info("Ultrasonic sensor threads started for %d slots + exit gate + VL53L1X entry", len(config.ULTRASONIC))

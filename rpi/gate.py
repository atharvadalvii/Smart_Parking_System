"""Servo gate control via PCA9685 I2C servo driver board."""
import logging
import threading
import time

import RPi.GPIO as GPIO

import config
import mqtt_client

logger = logging.getLogger(__name__)

_kit = None   # ServoKit instance


def _open_gate(channel: int, label: str):
    if _kit is None:
        logger.warning("%s gate: PCA9685 not available", label)
        return
    logger.info("%s gate opening (channel %d)", label, channel)
    _kit.servo[channel].angle = config.SERVO_OPEN_ANGLE
    time.sleep(config.GATE_OPEN_S)
    _kit.servo[channel].angle = config.SERVO_CLOSED_ANGLE
    logger.info("%s gate closed", label)


def on_entry_open(data: dict):
    """Called by MQTT when backend confirms QR entry."""
    logger.info("Entry gate command received: %s", data)
    threading.Thread(
        target=_open_gate,
        args=(config.SERVO_ENTRY_CHANNEL, "Entry"),
        daemon=True,
    ).start()


def on_exit_open(data: dict):
    """Called by MQTT when backend confirms payment."""
    logger.info("Exit gate command received: %s", data)
    threading.Thread(
        target=_open_gate,
        args=(config.SERVO_EXIT_CHANNEL, "Exit"),
        daemon=True,
    ).start()


def _ir_callback(channel):
    """GPIO edge interrupt for IR entry sensor."""
    if channel == config.IR_ENTRY_PIN:
        logger.info("IR entry sensor triggered")
        mqtt_client.publish_gate_entry()


def start():
    global _kit
    try:
        import board
        import busio
        from adafruit_servokit import ServoKit
        i2c = busio.I2C(board.SCL, board.SDA)
        _kit = ServoKit(channels=16, i2c=i2c, address=config.PCA9685_I2C_ADDRESS)
        _kit.servo[config.SERVO_ENTRY_CHANNEL].angle = config.SERVO_CLOSED_ANGLE
        _kit.servo[config.SERVO_EXIT_CHANNEL].angle  = config.SERVO_CLOSED_ANGLE
        logger.info("PCA9685 servo driver ready (I2C 0x%02X)", config.PCA9685_I2C_ADDRESS)
    except Exception as exc:
        logger.warning("PCA9685 not available: %s", exc)
        _kit = None


def cleanup():
    if _kit:
        try:
            _kit.servo[config.SERVO_ENTRY_CHANNEL].angle = config.SERVO_CLOSED_ANGLE
            _kit.servo[config.SERVO_EXIT_CHANNEL].angle  = config.SERVO_CLOSED_ANGLE
        except Exception:
            pass

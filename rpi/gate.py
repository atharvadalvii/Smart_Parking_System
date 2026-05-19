"""IR gate sensors + servo motor control."""
import logging
import threading
import time

import RPi.GPIO as GPIO

import config
import mqtt_client

logger = logging.getLogger(__name__)

_entry_servo = None
_exit_servo  = None


def _setup_servo(pin: int) -> GPIO.PWM:
    GPIO.setup(pin, GPIO.OUT)
    pwm = GPIO.PWM(pin, config.SERVO_FREQ)
    pwm.start(config.SERVO_CLOSED_DC)
    return pwm


def _open_gate(pwm: GPIO.PWM, label: str):
    logger.info("%s gate opening", label)
    pwm.ChangeDutyCycle(config.SERVO_OPEN_DC)
    time.sleep(config.GATE_OPEN_S)
    pwm.ChangeDutyCycle(config.SERVO_CLOSED_DC)
    logger.info("%s gate closed", label)


def on_entry_open(data: dict):
    """Called by MQTT when backend confirms QR entry — open entry servo."""
    logger.info("Entry gate command received: %s", data)
    threading.Thread(target=_open_gate, args=(_entry_servo, "Entry"), daemon=True).start()


def on_exit_open(data: dict):
    """Called by MQTT when backend confirms payment — open exit servo."""
    logger.info("Exit gate command received: %s", data)
    threading.Thread(target=_open_gate, args=(_exit_servo, "Exit"), daemon=True).start()


def _ir_callback(channel):
    """GPIO edge interrupt for IR sensors."""
    if channel == config.IR_ENTRY_PIN:
        logger.info("IR entry sensor triggered")
        mqtt_client.publish_gate_entry()
    elif channel == config.IR_EXIT_PIN:
        logger.info("IR exit sensor triggered")
        mqtt_client.publish_gate_exit()


def start():
    global _entry_servo, _exit_servo

    # IR sensors — input with pull-up, detect falling edge (active LOW)
    GPIO.setup(config.IR_ENTRY_PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)
    GPIO.setup(config.IR_EXIT_PIN,  GPIO.IN, pull_up_down=GPIO.PUD_UP)
    GPIO.add_event_detect(config.IR_ENTRY_PIN, GPIO.FALLING,
                          callback=_ir_callback, bouncetime=500)
    GPIO.add_event_detect(config.IR_EXIT_PIN,  GPIO.FALLING,
                          callback=_ir_callback, bouncetime=500)

    # Servo motors
    _entry_servo = _setup_servo(config.SERVO_ENTRY_PIN)
    _exit_servo  = _setup_servo(config.SERVO_EXIT_PIN)

    logger.info("Gate module ready (IR entry=%d, IR exit=%d)",
                config.IR_ENTRY_PIN, config.IR_EXIT_PIN)


def cleanup():
    if _entry_servo:
        _entry_servo.stop()
    if _exit_servo:
        _exit_servo.stop()

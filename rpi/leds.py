"""RGB slot LEDs + WS2812B NeoPixel path strip."""
import logging
import threading
import time

import RPi.GPIO as GPIO
import board
import neopixel

import config

logger = logging.getLogger(__name__)

# green=free  red=occupied  blue=reserved  off=unknown
_SLOT_COLOURS = {
    "free":     (False, True,  False),   # (R, G, B) active
    "occupied": (True,  False, False),
    "reserved": (False, False, True),
}

_strip: neopixel.NeoPixel = None
_path_timer: threading.Timer = None


# ── RGB LEDs ────────────────────────────────────────────────────────────────

def _setup_rgb():
    for pins in config.RGB_LEDS.values():
        GPIO.setup(pins["r"], GPIO.OUT)
        GPIO.setup(pins["g"], GPIO.OUT)
        GPIO.setup(pins["b"], GPIO.OUT)


def set_slot_led(slot_id: str, status: str):
    """Set the RGB LED for a slot based on its status."""
    pins = config.RGB_LEDS.get(slot_id)
    if pins is None:
        return
    r, g, b = _SLOT_COLOURS.get(status, (False, False, False))
    GPIO.output(pins["r"], r)
    GPIO.output(pins["g"], g)
    GPIO.output(pins["b"], b)
    logger.debug("LED %s → %s", slot_id, status)


# ── WS2812B NeoPixel strip ──────────────────────────────────────────────────

def _setup_strip():
    global _strip
    _strip = neopixel.NeoPixel(
        board.D18,
        config.NEOPIXEL_COUNT,
        brightness=config.NEOPIXEL_BRIGHTNESS,
        auto_write=False,
    )
    _strip.fill((0, 0, 0))
    _strip.show()


def _clear_strip():
    if _strip:
        _strip.fill((0, 0, 0))
        _strip.show()


def show_path(waypoints: list):
    """Light up the NeoPixel LEDs along the Dijkstra path, then clear after timeout."""
    global _path_timer

    if _path_timer:
        _path_timer.cancel()

    if not _strip:
        return

    _strip.fill((0, 0, 0))
    for node in waypoints:
        leds = config.WAYPOINT_LEDS.get(node)
        if leds:
            start, end = leds
            for i in range(start, end + 1):
                _strip[i] = config.PATH_COLOUR
    _strip.show()
    logger.info("Path lit: %s", " → ".join(waypoints))

    _path_timer = threading.Timer(config.PATH_ACTIVE_S, _clear_strip)
    _path_timer.daemon = True
    _path_timer.start()


# ── Init / cleanup ──────────────────────────────────────────────────────────

def start():
    _setup_rgb()
    _setup_strip()
    # Default all slots to free (green)
    for slot_id in config.RGB_LEDS:
        set_slot_led(slot_id, "free")
    logger.info("LED module ready")


def cleanup():
    _clear_strip()
    for pins in config.RGB_LEDS.values():
        GPIO.output(pins["r"], False)
        GPIO.output(pins["g"], False)
        GPIO.output(pins["b"], False)

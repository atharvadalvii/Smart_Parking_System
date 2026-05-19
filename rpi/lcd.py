"""16×2 I2C LCD display — shows slot availability and gate messages."""
import logging
import threading
import time

from RPLCD.i2c import CharLCD

import config

logger = logging.getLogger(__name__)

_lcd: CharLCD = None
_lock = threading.Lock()


def start():
    global _lcd
    try:
        _lcd = CharLCD(
            i2c_expander="PCF8574",
            address=config.LCD_I2C_ADDRESS,
            port=1,
            cols=config.LCD_COLS,
            rows=config.LCD_ROWS,
            dotsize=8,
        )
        _lcd.clear()
        _write("Smart Parking", "System Ready")
        logger.info("LCD ready at I2C 0x%02X", config.LCD_I2C_ADDRESS)
    except Exception as exc:
        logger.warning("LCD not available: %s", exc)
        _lcd = None


def _write(line1: str, line2: str = ""):
    if _lcd is None:
        return
    with _lock:
        _lcd.clear()
        _lcd.write_string(line1[:config.LCD_COLS])
        _lcd.cursor_pos = (1, 0)
        _lcd.write_string(line2[:config.LCD_COLS])


def show_slot_summary(slots: dict):
    """slots = {'S1': 'free', 'S2': 'occupied', 'S3': 'reserved'}"""
    symbols = {"free": "O", "occupied": "X", "reserved": "R"}
    summary = "  ".join(
        f"{sid[-1]}:{symbols.get(st, '?')}"
        for sid, st in sorted(slots.items())
    )
    _write("Slots:", summary)


def show_gate_message(gate: str, message: str, duration_s: float = 4.0):
    """Briefly show a gate event message, then restore slot summary."""
    label = "ENTRY" if gate == "entry" else "EXIT"
    _write(f"{label} GATE", message)
    threading.Timer(duration_s, lambda: _write("Smart Parking", "")).start()


def show_welcome(slot_number: str):
    _write("Welcome!", f"Go to Slot {slot_number}")


def show_farewell(fare_aud: float):
    _write("Payment OK!", f"Fare: ${fare_aud:.2f} AUD")


def cleanup():
    if _lcd:
        _lcd.clear()
        _lcd.close(clear=True)

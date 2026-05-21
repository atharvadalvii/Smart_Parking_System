"""ST7032 I2C LCD display driver."""
import logging
import threading
import time

import config

logger = logging.getLogger(__name__)

_lcd = None
_lock = threading.Lock()


class _ST7032:
    """Minimal ST7032 I2C character LCD driver."""
    _CMD  = 0x00
    _DATA = 0x40

    def __init__(self, address: int, bus: int = 1):
        import smbus2
        self._addr = address
        self._bus  = smbus2.SMBus(bus)
        self._init()

    def _write_cmd(self, cmd: int):
        self._bus.write_byte_data(self._addr, self._CMD, cmd)
        time.sleep(0.001)

    def _write_data(self, data: int):
        self._bus.write_byte_data(self._addr, self._DATA, data)

    def _init(self):
        time.sleep(0.04)
        self._write_cmd(0x38)   # 8-bit, 2-line, normal instruction set
        self._write_cmd(0x39)   # switch to extended instruction set
        self._write_cmd(0x14)   # internal OSC frequency
        self._write_cmd(0x70)   # contrast low bits
        self._write_cmd(0x56)   # power/icon/contrast high bits
        self._write_cmd(0x6C)   # follower control
        time.sleep(0.2)
        self._write_cmd(0x38)   # back to normal instruction set
        self._write_cmd(0x0C)   # display on, cursor off
        self._write_cmd(0x01)   # clear
        time.sleep(0.002)

    def clear(self):
        self._write_cmd(0x01)
        time.sleep(0.002)

    def set_cursor(self, row: int, col: int):
        addr = (0x80 + col) if row == 0 else (0xC0 + col)
        self._write_cmd(addr)

    def write(self, text: str):
        for ch in text[:config.LCD_COLS]:
            self._write_data(ord(ch))

    def close(self, clear: bool = True):
        if clear:
            self.clear()
        self._bus.close()


def start():
    global _lcd
    try:
        _lcd = _ST7032(config.LCD_I2C_ADDRESS)
        _write("Smart Parking", "System Ready")
        logger.info("LCD ready at I2C 0x%02X", config.LCD_I2C_ADDRESS)
    except Exception as exc:
        logger.warning("LCD not available: %s", exc)
        _lcd = None


def _write(line1: str, line2: str = ""):
    if _lcd is None:
        return
    with _lock:
        try:
            _lcd.clear()
            _lcd.set_cursor(0, 0)
            _lcd.write(line1)
            _lcd.set_cursor(1, 0)
            _lcd.write(line2)
        except Exception as exc:
            logger.warning("LCD write error: %s", exc)


def show_slot_summary(slots: dict):
    symbols = {"free": "O", "occupied": "X", "reserved": "R"}
    summary = "  ".join(
        f"{sid[-1]}:{symbols.get(st, '?')}"
        for sid, st in sorted(slots.items())
    )
    _write("Slots:", summary)


def show_gate_message(gate: str, message: str, duration_s: float = 4.0):
    label = "ENTRY" if gate == "entry" else "EXIT"
    _write(f"{label} GATE", message)
    threading.Timer(duration_s, lambda: _write("Smart Parking", "")).start()


def show_welcome(slot_number: str):
    _write("Welcome!", f"Go to Slot {slot_number}")


def show_farewell(fare_aud: float):
    _write("Payment OK!", f"Fare: ${fare_aud:.2f} AUD")


def cleanup():
    if _lcd:
        try:
            _lcd.close(clear=True)
        except Exception:
            pass

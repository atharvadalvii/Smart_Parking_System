"""GM65 QR scanner reader — USB HID device acts as a keyboard.

The GM65 types the scanned string followed by Enter. We read it via evdev
so no terminal focus is required. Each scan calls the backend entry or exit
endpoint depending on the gate context passed at startup.
"""
import logging
import threading

import evdev
import requests

import config

logger = logging.getLogger(__name__)

# evdev key → character mapping (subset needed for booking IDs)
_KEY_MAP = {
    evdev.ecodes.KEY_A: "a", evdev.ecodes.KEY_B: "b", evdev.ecodes.KEY_C: "c",
    evdev.ecodes.KEY_D: "d", evdev.ecodes.KEY_E: "e", evdev.ecodes.KEY_F: "f",
    evdev.ecodes.KEY_G: "g", evdev.ecodes.KEY_H: "h", evdev.ecodes.KEY_I: "i",
    evdev.ecodes.KEY_J: "j", evdev.ecodes.KEY_K: "k", evdev.ecodes.KEY_L: "l",
    evdev.ecodes.KEY_M: "m", evdev.ecodes.KEY_N: "n", evdev.ecodes.KEY_O: "o",
    evdev.ecodes.KEY_P: "p", evdev.ecodes.KEY_Q: "q", evdev.ecodes.KEY_R: "r",
    evdev.ecodes.KEY_S: "s", evdev.ecodes.KEY_T: "t", evdev.ecodes.KEY_U: "u",
    evdev.ecodes.KEY_V: "v", evdev.ecodes.KEY_W: "w", evdev.ecodes.KEY_X: "x",
    evdev.ecodes.KEY_Y: "y", evdev.ecodes.KEY_Z: "z",
    evdev.ecodes.KEY_0: "0", evdev.ecodes.KEY_1: "1", evdev.ecodes.KEY_2: "2",
    evdev.ecodes.KEY_3: "3", evdev.ecodes.KEY_4: "4", evdev.ecodes.KEY_5: "5",
    evdev.ecodes.KEY_6: "6", evdev.ecodes.KEY_7: "7", evdev.ecodes.KEY_8: "8",
    evdev.ecodes.KEY_9: "9", evdev.ecodes.KEY_MINUS: "-",
}


def _find_device() -> evdev.InputDevice | None:
    """Auto-detect the GM65 if QR_DEVICE_PATH is not set."""
    if config.QR_DEVICE_PATH:
        return evdev.InputDevice(config.QR_DEVICE_PATH)
    for path in evdev.list_devices():
        dev = evdev.InputDevice(path)
        if "GM65" in dev.name or "HID" in dev.name or "scanner" in dev.name.lower():
            logger.info("QR scanner found: %s (%s)", dev.name, path)
            return dev
    return None


def _resolve_gate(booking_id: str) -> str | None:
    """GET the booking status and return 'entry' or 'exit', or None on error."""
    url = f"{config.BACKEND_URL}/api/bookings/{booking_id}"
    try:
        resp = requests.get(url, timeout=5)
        if not resp.ok:
            logger.warning("Could not fetch booking %s: %s", booking_id, resp.status_code)
            return None
        status = resp.json().get("status", "")
        if status == "pending":
            return "entry"
        if status == "active":
            return "exit"
        logger.warning("Booking %s status '%s' — not actionable at gate", booking_id, status)
        return None
    except Exception as exc:
        logger.error("Booking lookup failed: %s", exc)
        return None


def _call_backend(booking_id: str):
    """Determine entry vs exit from booking status, then PUT the right endpoint."""
    gate = _resolve_gate(booking_id)
    if gate is None:
        return
    url = f"{config.BACKEND_URL}/api/bookings/{booking_id}/{gate}"
    try:
        resp = requests.put(url, timeout=5)
        data = resp.json()
        if resp.ok:
            logger.info("Backend %s OK: %s", gate, data)
        else:
            logger.warning("Backend %s error: %s", gate, data)
    except Exception as exc:
        logger.error("Backend call failed: %s", exc)


_SHIFT_KEYS = {evdev.ecodes.KEY_LEFTSHIFT, evdev.ecodes.KEY_RIGHTSHIFT}


def _read_loop(stop_event: threading.Event):
    """Read keystrokes from the single HID device and fire backend calls on Enter."""
    device = _find_device()
    if device is None:
        logger.error("QR scanner device not found — set QR_DEVICE_PATH in .env")
        return

    device.grab()   # exclusive access so keystrokes don't reach the OS
    logger.info("QR scanner ready (auto entry/exit from booking status)")

    buffer = ""
    shift_held = False
    for event in device.read_loop():
        if stop_event.is_set():
            break
        if event.type != evdev.ecodes.EV_KEY:
            continue
        key_event = evdev.categorize(event)

        # Track shift key state for uppercase decoding
        if key_event.scancode in _SHIFT_KEYS:
            shift_held = key_event.keystate in (evdev.KeyEvent.key_down, evdev.KeyEvent.key_hold)
            continue

        if key_event.keystate != evdev.KeyEvent.key_down:
            continue

        code = key_event.scancode
        if code == evdev.ecodes.KEY_ENTER:
            booking_id = buffer.strip()
            buffer = ""
            shift_held = False
            if booking_id:
                logger.info("QR scanned: %s", booking_id)
                threading.Thread(
                    target=_call_backend,
                    args=(booking_id,),
                    daemon=True,
                ).start()
        else:
            ch = _KEY_MAP.get(code, "")
            buffer += ch.upper() if shift_held and ch.isalpha() else ch


def start(stop_event: threading.Event):
    """Spawns one daemon thread that reads the single GM65 HID device."""
    t = threading.Thread(
        target=_read_loop,
        args=(stop_event,),
        daemon=True,
        name="qr-scanner",
    )
    t.start()

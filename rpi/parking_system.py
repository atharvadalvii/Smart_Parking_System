"""
parking_system.py
Group 19 - Smart Parking Management System
Author: Jagdish Singh (24410218)
Purpose: Entry gate    — PiicoDev VL53L1X laser sensor
         Exit gate     — RCWL-1601 ultrasonic sensor (GPIO 5/6)
         Slots 1-3     — RCWL-1601 ultrasonic sensors
         Both gates    — servo motors via PCA9685
         OLED display  — SSD1306 rotates through all 3 slot statuses
         LCD display   — ST7032 shows cars inside + vacancy summary
         All events    — published via MQTT to dashboard backend
"""

import os
import json
import time
import logging
import threading
import board
import busio
import adafruit_vl53l1x
import RPi.GPIO as GPIO
import paho.mqtt.client as mqtt
import requests
import smbus2
from adafruit_servokit import ServoKit
from luma.core.interface.serial import i2c as luma_i2c
from luma.oled.device import ssd1306
from luma.core.render import canvas
from PIL import ImageFont
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [PARKING] %(levelname)s: %(message)s"
)
log = logging.getLogger(__name__)

# ── MQTT + Backend ─────────────────────────────────────────────
MQTT_BROKER  = os.environ.get("MQTT_BROKER", "localhost")
MQTT_PORT    = int(os.environ.get("MQTT_PORT", 1883))
BACKEND_URL  = os.environ.get("BACKEND_URL", "http://172.20.10.3:5001")
TOTAL_SLOTS  = 3

# ── Entry sensor (VL53L1X laser) ───────────────────────────────
ENTRY_THRESHOLD_CM = 5

# ── Exit gate sensor (RCWL-1601) ───────────────────────────────
EXIT_TRIG         = 5
EXIT_ECHO         = 6
EXIT_THRESHOLD_CM = 5

# ── Slot sensors (RCWL-1601) ───────────────────────────────────
SLOT_SENSORS = {
    1: {"TRIG": 17, "ECHO": 27},
    2: {"TRIG": 22, "ECHO": 23},
    3: {"TRIG": 24, "ECHO": 25},
}
SLOT_THRESHOLD_CM = 5.0
SLOT_POLL_SEC     = 0.5

# ── OLED settings ──────────────────────────────────────────────
OLED_ADDRESS    = 0x3D
OLED_I2C_PORT   = 1
FONT_PATH       = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_LARGE      = 18
FONT_SMALL      = 14
OLED_ROTATE_SEC = 2.0

# ── LCD settings ───────────────────────────────────────────────
LCD_ADDR    = 0x3E
LCD_I2C_BUS = 1

# ── Shared ─────────────────────────────────────────────────────
DEBOUNCE_COUNT = 3
CLEAR_WAIT_SEC = 3

# ── Servo settings ─────────────────────────────────────────────
ENTRY_SERVO_CHANNEL = 0
EXIT_SERVO_CHANNEL  = 2
ANGLE_OPEN          = 85
ANGLE_CLOSED        = 5
SERVO_STEP          = 1
SERVO_DELAY         = 0.04


# ═══════════════════════════════════════════════════════════════
# HARDWARE INIT
# ═══════════════════════════════════════════════════════════════

GPIO.setmode(GPIO.BCM)
GPIO.setup(EXIT_TRIG, GPIO.OUT)
GPIO.setup(EXIT_ECHO, GPIO.IN)
GPIO.output(EXIT_TRIG, False)
for pins in SLOT_SENSORS.values():
    GPIO.setup(pins["TRIG"], GPIO.OUT)
    GPIO.setup(pins["ECHO"], GPIO.IN)
    GPIO.output(pins["TRIG"], False)
time.sleep(0.5)
log.info("GPIO ready")

# VL53L1X entry laser
_busio_i2c   = busio.I2C(board.SCL, board.SDA)
entry_sensor = adafruit_vl53l1x.VL53L1X(_busio_i2c)
entry_sensor.distance_mode = 2
entry_sensor.timing_budget = 100
entry_sensor.start_ranging()
log.info("Entry laser sensor ready")

# Servos
kit = ServoKit(channels=16, address=0x44)
for ch in (ENTRY_SERVO_CHANNEL, EXIT_SERVO_CHANNEL):
    kit.servo[ch].set_pulse_width_range(500, 2500)
    kit.servo[ch].angle = ANGLE_CLOSED
log.info("Both servos ready — gates closed")

# OLED
def setup_oled():
    try:
        serial = luma_i2c(port=OLED_I2C_PORT, address=OLED_ADDRESS)
        device = ssd1306(serial, width=128, height=64)
        log.info(f"OLED ready at 0x{OLED_ADDRESS:02X}")
        return device
    except Exception as e:
        log.warning(f"OLED not available: {e}")
        return None

def load_fonts():
    try:
        return (ImageFont.truetype(FONT_PATH, FONT_LARGE),
                ImageFont.truetype(FONT_PATH, FONT_SMALL))
    except Exception:
        log.warning("Custom font not found — using default")
        f = ImageFont.load_default()
        return f, f

oled           = setup_oled()
font_large, font_small = load_fonts()

# LCD
def setup_lcd():
    try:
        bus = smbus2.SMBus(LCD_I2C_BUS)
        log.info(f"LCD ready at 0x{LCD_ADDR:02X}")
        return bus
    except Exception as e:
        log.warning(f"LCD not available: {e}")
        return None

lcd_bus = setup_lcd()

def _lcd_send(data, mode=0x00):
    if lcd_bus is None:
        return
    try:
        lcd_bus.write_byte_data(LCD_ADDR, mode, data)
        time.sleep(0.001)
    except Exception as e:
        log.warning(f"LCD write error: {e}")

def _lcd_command(cmd): _lcd_send(cmd, 0x00)
def _lcd_char(ch):     _lcd_send(ord(ch), 0x40)

def lcd_init():
    if lcd_bus is None:
        return
    time.sleep(0.05)
    for cmd in (0x38, 0x39, 0x14, 0x78, 0x5E, 0x6A):
        _lcd_command(cmd)
        time.sleep(0.05)
    time.sleep(0.2)
    for cmd in (0x0C, 0x01, 0x06):
        _lcd_command(cmd)
        time.sleep(0.05)
    log.info("LCD initialised")

def lcd_clear():
    _lcd_command(0x01)
    time.sleep(0.002)

def lcd_line1(): _lcd_command(0x80)
def lcd_line2(): _lcd_command(0xC0)

def lcd_print(text, max_chars=16):
    for ch in text[:max_chars].ljust(max_chars):
        _lcd_char(ch)


# ═══════════════════════════════════════════════════════════════
# MQTT
# ═══════════════════════════════════════════════════════════════

_mqtt_client   = None
_entry_open_ev = threading.Event()
_exit_open_ev  = threading.Event()


def _on_connect(client, userdata, flags, reason_code, properties=None):
    if reason_code == 0:
        client.subscribe("parking/gate/entry/open")
        client.subscribe("parking/gate/exit/open")
        log.info("MQTT connected — subscribed to gate/open topics")
    else:
        log.error(f"MQTT connection refused (reason_code={reason_code})")


def _on_message(client, userdata, msg):
    if msg.topic == "parking/gate/entry/open":
        _entry_open_ev.set()
    elif msg.topic == "parking/gate/exit/open":
        _exit_open_ev.set()


def setup_mqtt():
    global _mqtt_client
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    client.on_connect = _on_connect
    client.on_message = _on_message
    try:
        client.connect(MQTT_BROKER, MQTT_PORT)
        client.loop_start()
        _mqtt_client = client
        log.info(f"MQTT connected to {MQTT_BROKER}:{MQTT_PORT}")
        return client, True
    except Exception as e:
        log.warning(f"MQTT not available: {e}")
        return client, False


def publish(client, mqtt_ok, topic, payload):
    if not mqtt_ok:
        return
    try:
        if isinstance(payload, dict):
            msg = json.dumps(payload)
        else:
            msg = json.dumps({"status": payload.lower()})
        client.publish(topic, msg, qos=1)
        log.debug(f"MQTT → {topic}: {msg}")
    except Exception as e:
        log.warning(f"MQTT publish failed: {e}")


# ═══════════════════════════════════════════════════════════════
# DISPLAY FUNCTIONS
# ═══════════════════════════════════════════════════════════════

def count_cars(slot_states):
    return sum(1 for s in slot_states.values() if s in ("occupied", "reserved"))


def lcd_update(slot_states):
    cars_inside    = count_cars(slot_states)
    free_count     = sum(1 for s in slot_states.values() if s == "free")
    occupied_count = sum(1 for s in slot_states.values() if s == "occupied")
    lcd_line1()
    lcd_print(f"Cars In: {cars_inside}  ")
    lcd_line2()
    lcd_print(f"Free:{free_count}  Occup:{occupied_count}")


def oled_startup():
    if oled is None:
        return
    with canvas(oled) as draw:
        draw.rectangle(oled.bounding_box, fill="black")
        draw.text((5,  4), "Smart",    font=font_large, fill="white")
        draw.text((5, 24), "Parking",  font=font_large, fill="white")
        draw.text((5, 46), "Group 19", font=font_small, fill="white")
    time.sleep(2)


def oled_show_slot(slot_num, status):
    if oled is None:
        return
    with canvas(oled) as draw:
        draw.rectangle(oled.bounding_box, fill="black")
        draw.text((5, 2), f"SLOT {slot_num}", font=font_large, fill="white")
        draw.line([(0, 26), (128, 26)], fill="white", width=1)
        if status == "free":
            draw.text((5, 34), "FREE",     font=font_large, fill="white")
        elif status == "occupied":
            draw.rectangle([(0, 28), (128, 64)], fill="white")
            draw.text((5, 34), "OCCUPIED", font=font_small, fill="black")
        elif status == "reserved":
            for x in range(0, 128, 6):
                draw.line([(x, 62), (x + 3, 62)], fill="white", width=1)
            draw.text((5, 34), "RESERVED", font=font_small, fill="white")


# ═══════════════════════════════════════════════════════════════
# DISTANCE FUNCTIONS
# ═══════════════════════════════════════════════════════════════

def get_entry_distance():
    if entry_sensor.data_ready:
        dist = entry_sensor.distance
        entry_sensor.clear_interrupt()
        return dist
    return None


def get_ultrasonic_distance(trig, echo):
    GPIO.output(trig, True)
    time.sleep(0.00001)
    GPIO.output(trig, False)
    deadline = time.time() + 0.04
    while GPIO.input(echo) == 0:
        if time.time() > deadline:
            return 999
    pulse_start = time.time()
    while GPIO.input(echo) == 1:
        if time.time() > deadline:
            return 999
    return round((time.time() - pulse_start) * 17150, 1)


def get_exit_distance():
    return get_ultrasonic_distance(EXIT_TRIG, EXIT_ECHO)


def get_slot_distance(slot_num):
    p = SLOT_SENSORS[slot_num]
    return get_ultrasonic_distance(p["TRIG"], p["ECHO"])


# ═══════════════════════════════════════════════════════════════
# SERVO HELPERS
# ═══════════════════════════════════════════════════════════════

def move_servo(channel, start_angle, end_angle):
    step = SERVO_STEP if end_angle > start_angle else -SERVO_STEP
    for angle in range(start_angle, end_angle + step, step):
        angle = max(ANGLE_CLOSED, min(ANGLE_OPEN, angle))
        kit.servo[channel].angle = angle
        time.sleep(SERVO_DELAY)
    kit.servo[channel].angle = end_angle


def open_gate(channel, name):
    print(f"\n  {name} GATE OPENING...")
    move_servo(channel, ANGLE_CLOSED, ANGLE_OPEN)
    log.info(f"{name} gate opened")


def close_gate(channel, name):
    print(f"  {name} GATE CLOSING...")
    move_servo(channel, ANGLE_OPEN, ANGLE_CLOSED)
    log.info(f"{name} gate closed")


def wait_then_close(channel, dist_fn, threshold, name):
    """Wait for car to pass then close after CLEAR_WAIT_SEC of no detection."""
    clear_since = None
    deadline    = time.time() + 20
    while time.time() < deadline:
        dist = dist_fn()
        if dist is None:
            time.sleep(0.1)
            continue
        if dist >= threshold:
            if clear_since is None:
                clear_since = time.time()
            remaining = CLEAR_WAIT_SEC - (time.time() - clear_since)
            print(f"  Closing in {remaining:.1f}s...   ", end="\r")
            if remaining <= 0:
                break
        else:
            clear_since = None
            print(f"  Car still present...           ", end="\r")
        time.sleep(0.2)
    print()
    close_gate(channel, name)


# ═══════════════════════════════════════════════════════════════
# SLOT OCCUPANCY POLLING
# ═══════════════════════════════════════════════════════════════

def poll_slots(client, mqtt_ok, slot_states, slot_debounce):
    changed = False
    for slot_num in SLOT_SENSORS:
        dist = get_slot_distance(slot_num)
        if dist == 999:
            continue

        physical = "occupied" if dist < SLOT_THRESHOLD_CM else "free"

        if slot_states[slot_num] == "reserved" and physical == "free":
            continue

        if physical != slot_states[slot_num]:
            slot_debounce[slot_num] += 1
            if slot_debounce[slot_num] >= DEBOUNCE_COUNT:
                slot_states[slot_num]   = physical
                slot_debounce[slot_num] = 0
                changed = True
                log.info(f"Slot {slot_num}: {dist}cm → {physical}")
                print(f"\n  Slot {slot_num}: {dist}cm → {physical}")
                publish(client, mqtt_ok,
                        f"parking/slot/{slot_num}",
                        {"distance": dist})
        else:
            slot_debounce[slot_num] = 0
    return changed


# ═══════════════════════════════════════════════════════════════
# QR VALIDATION
# ═══════════════════════════════════════════════════════════════

def _parse_slot_num(slot_str):
    """Convert backend slot value ('S1', '1', 1) to int (1, 2, 3) or None."""
    if slot_str is None:
        return None
    try:
        return int(str(slot_str).strip().upper().replace("S", ""))
    except (ValueError, AttributeError):
        return None


def validate_entry():
    """Read QR from scanner → POST /api/gate/scan → returns (granted, slot_num)."""
    print("\n  Scan QR code at entry gate...")
    try:
        qr_value = input().strip()
    except Exception:
        return False, None

    if not qr_value:
        return False, None

    try:
        resp = requests.post(
            f"{BACKEND_URL}/api/gate/scan",
            json={"user_id": qr_value},
            timeout=5,
        )
        data = resp.json()
        if resp.ok and data.get("action") == "entry":
            slot_num = _parse_slot_num(data.get("slot"))
            log.info(f"Entry granted — QR: {qr_value}, slot: {data.get('slot')}")
            print(f"\n  ENTRY GRANTED! Go to Slot {data.get('slot', '')}")
            return True, slot_num
        else:
            reason = data.get("message") or data.get("reason") or "Access denied"
            print(f"\n  DENIED: {reason}")
            return False, None
    except requests.exceptions.ConnectionError:
        log.warning("Backend offline — manual override")
        print("  Backend offline. Grant access? (Y/N): ", end="")
        try:
            ans = input().strip().upper()
            return ans == "Y", None
        except Exception:
            return False, None
    except Exception as e:
        log.warning(f"Entry validation error: {e}")
        return False, None


def validate_exit():
    """Read QR from scanner → POST /api/gate/scan → returns (granted, slot_num)."""
    print("\n  Scan QR code at exit gate...")
    try:
        qr_value = input().strip()
    except Exception:
        return False, None

    if not qr_value:
        return False, None

    try:
        resp = requests.post(
            f"{BACKEND_URL}/api/gate/scan",
            json={"user_id": qr_value},
            timeout=5,
        )
        data = resp.json()
        if resp.ok and data.get("action") == "exit":
            slot_num = _parse_slot_num(data.get("slot"))
            fare = data.get("fare_amount") or 0
            log.info(f"Exit granted — QR: {qr_value}, fare: ${fare:.2f}")
            print(f"\n  EXIT GRANTED! Fare: ${fare:.2f}")
            return True, slot_num
        else:
            reason = data.get("message") or data.get("reason") or "Access denied"
            print(f"\n  DENIED: {reason}")
            return False, None
    except requests.exceptions.ConnectionError:
        log.warning("Backend offline — manual override")
        print("  Backend offline. Grant exit? (Y/N): ", end="")
        try:
            ans = input().strip().upper()
            return ans == "Y", None
        except Exception:
            return False, None
    except Exception as e:
        log.warning(f"Exit validation error: {e}")
        return False, None


# ═══════════════════════════════════════════════════════════════
# GATE HANDLERS
# ═══════════════════════════════════════════════════════════════

def handle_entry(client, mqtt_ok, slot_counter, slot_states):
    """Rising-edge entry: validate QR → open gate → update slot state."""
    granted, slot_num = validate_entry()

    if not granted:
        print("  ACCESS DENIED! Entry gate stays closed")
        return slot_counter

    open_gate(ENTRY_SERVO_CHANNEL, "ENTRY")

    # Update local slot state using slot returned by backend, or first free fallback
    assigned = None
    if slot_num and slot_num in slot_states:
        assigned = slot_num
    else:
        for s in [slot_counter, 1, 2, 3]:
            if slot_states.get(s) == "free":
                assigned = s
                break

    if assigned:
        slot_states[assigned] = "occupied"
        lcd_update(slot_states)
        oled_show_slot(assigned, "occupied")
        print(f"\n  Slot {assigned} marked occupied")
        publish(client, mqtt_ok, f"parking/slot/{assigned}", {"distance": 0})

    # Close gate in background once car clears
    threading.Thread(
        target=wait_then_close,
        args=(ENTRY_SERVO_CHANNEL, get_entry_distance, ENTRY_THRESHOLD_CM, "ENTRY"),
        daemon=True,
    ).start()

    next_counter = ((assigned or slot_counter) % 3) + 1
    return next_counter


def handle_exit(client, mqtt_ok, slot_counter, slot_states):
    """Rising-edge exit: scan QR → backend calculates fare → website confirms payment → gate opens."""
    print("\n  Scan QR code at exit gate...")
    try:
        qr_value = input().strip()
    except Exception:
        return

    if not qr_value:
        return

    # ── Step 1: Call backend — get fare, backend broadcasts to website ────────
    try:
        resp = requests.post(
            f"{BACKEND_URL}/api/gate/scan",
            json={"user_id": qr_value},
            timeout=5,
        )
        data = resp.json()
        action = data.get("action")

        if action == "exit_pending":
            fare     = data.get("fare_amount") or 0.00
            slot_num = _parse_slot_num(data.get("slot"))
            log.info(f"Exit pending payment — QR: {qr_value}, fare: ${fare:.2f}")
            print(f"\n  FARE: ${fare:.2f} — Waiting for payment on website...")
            lcd_line1()
            lcd_print(f"Fare: ${fare:.2f}     ")
            lcd_line2()
            lcd_print("Pay on website  ")

        elif action == "exit":
            # Backend already confirmed (shouldn't happen in new flow, but handle it)
            fare     = data.get("fare_amount") or 0.00
            slot_num = _parse_slot_num(data.get("slot"))
            log.info(f"Exit direct — QR: {qr_value}, fare: ${fare:.2f}")
            open_gate(EXIT_SERVO_CHANNEL, "EXIT")
            _free_slot(client, mqtt_ok, slot_num, slot_states)
            threading.Thread(target=wait_then_close,
                args=(EXIT_SERVO_CHANNEL, get_exit_distance, EXIT_THRESHOLD_CM, "EXIT"),
                daemon=True).start()
            return

        else:
            reason = data.get("message") or data.get("reason") or "Access denied"
            print(f"\n  DENIED: {reason}")
            return

    except requests.exceptions.ConnectionError:
        log.warning("Backend offline")
        print("  Backend offline. Grant exit? (Y/N): ", end="", flush=True)
        try:
            if input().strip().upper() != "Y":
                return
        except Exception:
            return
        slot_num = None
        open_gate(EXIT_SERVO_CHANNEL, "EXIT")
        _free_slot(client, mqtt_ok, slot_num, slot_states)
        threading.Thread(target=wait_then_close,
            args=(EXIT_SERVO_CHANNEL, get_exit_distance, EXIT_THRESHOLD_CM, "EXIT"),
            daemon=True).start()
        return
    except Exception as e:
        log.warning(f"Exit scan error: {e}")
        return

    # ── Step 2: Wait for MQTT signal from backend (after website payment) ─────
    _exit_open_ev.clear()
    confirmed = _exit_open_ev.wait(timeout=120)   # 2-minute window

    if not confirmed:
        print("\n  Payment timeout — gate stays closed.")
        lcd_update(slot_states)
        return

    # ── Step 3: Payment confirmed via website → open gate ─────────────────────
    print("\n  PAYMENT CONFIRMED — opening exit gate!")
    open_gate(EXIT_SERVO_CHANNEL, "EXIT")
    _free_slot(client, mqtt_ok, slot_num, slot_states)
    threading.Thread(
        target=wait_then_close,
        args=(EXIT_SERVO_CHANNEL, get_exit_distance, EXIT_THRESHOLD_CM, "EXIT"),
        daemon=True,
    ).start()


def _free_slot(client, mqtt_ok, slot_num, slot_states):
    """Mark a slot as free locally and publish to MQTT."""
    freed = None
    if slot_num and slot_num in slot_states:
        freed = slot_num
    else:
        for s in [1, 2, 3]:
            if slot_states.get(s) == "occupied":
                freed = s
                break
    if freed:
        slot_states[freed] = "free"
        lcd_update(slot_states)
        oled_show_slot(freed, "free")
        print(f"\n  Slot {freed} now free")
        publish(client, mqtt_ok, f"parking/slot/{freed}", {"distance": 999})


# ═══════════════════════════════════════════════════════════════
# MAIN LOOP
# ═══════════════════════════════════════════════════════════════

def main():
    print("=" * 45)
    print("  Smart Parking Management System")
    print("  Group 19")
    print("=" * 45)

    client, mqtt_ok = setup_mqtt()
    lcd_init()
    oled_startup()

    slot_counter  = 1
    slot_states   = {1: "free", 2: "free", 3: "free"}
    slot_debounce = {1: 0,      2: 0,      3: 0}

    entry_present  = exit_present  = False
    entry_debounce = exit_debounce = 0
    entry_last     = exit_last     = False

    last_slot_poll   = time.time()
    last_oled_rotate = time.time()
    display_slot     = 1

    lcd_update(slot_states)
    oled_show_slot(display_slot, slot_states[display_slot])

    print("\nMonitoring gates and parking slots...")
    print("Press Ctrl+C to stop\n")

    try:
        while True:
            entry_dist = get_entry_distance()
            exit_dist  = get_exit_distance()

            e_str = f"{entry_dist:.1f}cm" if entry_dist is not None else "---"
            print(
                f"Entry:{e_str} Exit:{exit_dist}cm "
                f"In:{count_cars(slot_states)} "
                f"S1:{slot_states[1][0].upper()} "
                f"S2:{slot_states[2][0].upper()} "
                f"S3:{slot_states[3][0].upper()} "
                f"[OLED→S{display_slot}]    ",
                end="\r"
            )

            # Entry debounce
            if entry_dist is not None:
                detected = entry_dist < ENTRY_THRESHOLD_CM
                if detected != entry_present:
                    entry_debounce += 1
                    if entry_debounce >= DEBOUNCE_COUNT:
                        entry_present  = detected
                        entry_debounce = 0
                else:
                    entry_debounce = 0

            # Exit debounce
            if exit_dist != 999:
                detected = exit_dist < EXIT_THRESHOLD_CM
                if detected != exit_present:
                    exit_debounce += 1
                    if exit_debounce >= DEBOUNCE_COUNT:
                        exit_present  = detected
                        exit_debounce = 0
                else:
                    exit_debounce = 0

            # Gate handlers on rising edge only
            if entry_present and not entry_last:
                print()
                slot_counter = handle_entry(client, mqtt_ok, slot_counter, slot_states)
                print("\nMonitoring...\n")

            if exit_present and not exit_last:
                print()
                handle_exit(client, mqtt_ok, slot_counter, slot_states)
                print("\nMonitoring...\n")

            entry_last = entry_present
            exit_last  = exit_present

            # Slot poll
            if time.time() - last_slot_poll >= SLOT_POLL_SEC:
                if poll_slots(client, mqtt_ok, slot_states, slot_debounce):
                    lcd_update(slot_states)
                last_slot_poll = time.time()

            # OLED rotation
            if time.time() - last_oled_rotate >= OLED_ROTATE_SEC:
                display_slot     = (display_slot % 3) + 1
                oled_show_slot(display_slot, slot_states[display_slot])
                last_oled_rotate = time.time()

            time.sleep(0.1)

    except KeyboardInterrupt:
        print("\n\nStopping...")
        close_gate(ENTRY_SERVO_CHANNEL, "ENTRY")
        close_gate(EXIT_SERVO_CHANNEL,  "EXIT")
        entry_sensor.stop_ranging()
        GPIO.cleanup()
        if oled:
            with canvas(oled) as draw:
                draw.rectangle(oled.bounding_box, fill="black")
        lcd_clear()
        lcd_line1()
        lcd_print("  System Off")
        if lcd_bus:
            lcd_bus.close()
        if mqtt_ok:
            client.loop_stop()
            client.disconnect()
        print("Done!")


if __name__ == "__main__":
    main()

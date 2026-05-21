import os
from dotenv import load_dotenv

load_dotenv()

# ── Backend ────────────────────────────────────────────────────────────────
BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:5001")

# ── MQTT ───────────────────────────────────────────────────────────────────
MQTT_BROKER   = os.environ.get("MQTT_BROKER", "localhost")
MQTT_PORT     = int(os.environ.get("MQTT_PORT", 1883))
MQTT_USERNAME = os.environ.get("MQTT_USERNAME", "")
MQTT_PASSWORD = os.environ.get("MQTT_PASSWORD", "")

# ── HC-SR04 Ultrasonic Sensors (TRIG, ECHO) per slot ──────────────────────
ULTRASONIC = {
    "1": {"trig": 23, "echo": 24},
    "2": {"trig": 20, "echo": 21},
    "3": {"trig": 26, "echo": 19},
}
SENSOR_INTERVAL_S = 2.0       # how often to poll each sensor
OCCUPANCY_THRESHOLD_CM = 15   # distance below this → car present

# ── IR Gate Sensors (input, active LOW) ───────────────────────────────────
IR_ENTRY_PIN = 5
# IR_EXIT_PIN replaced by ultrasonic — set pins below

# ── Exit gate ultrasonic (replaces IR exit sensor) ────────────────────────
ULTRASONIC_EXIT_GATE = {
    "trig": int(os.environ.get("EXIT_GATE_TRIG", 16)),
    "echo": int(os.environ.get("EXIT_GATE_ECHO", 25)),
}

# ── Servo Motors (PWM, 50 Hz) ─────────────────────────────────────────────
SERVO_ENTRY_PIN  = 12
SERVO_EXIT_PIN   = 13
SERVO_FREQ       = 50
SERVO_OPEN_DC    = 7.5   # duty cycle for 90° (gate open)
SERVO_CLOSED_DC  = 2.5   # duty cycle for 0°  (gate closed)
GATE_OPEN_S      = 5.0   # seconds gate stays open

# ── RGB LEDs per slot (R, G, B GPIO pins, common cathode) ─────────────────
RGB_LEDS = {
    "S1": {"r": 17, "g": 27, "b": 22},
    "S2": {"r": 10, "g":  9, "b": 11},
    "S3": {"r": 25, "g":  8, "b":  7},
}

# ── WS2812B NeoPixel LED Strip (path guidance) ────────────────────────────
NEOPIXEL_PIN        = 18    # must be a hardware PWM pin
NEOPIXEL_COUNT      = 24    # total LEDs on the strip
NEOPIXEL_BRIGHTNESS = 0.3
# Map graph waypoint names → LED index ranges on the strip
WAYPOINT_LEDS = {
    "entry":    (0,  2),
    "junction": (3,  5),
    "bay_S1":   (6,  8),
    "S1":       (9,  11),
    "bay_S2":   (12, 14),
    "S2":       (15, 17),
    "bay_S3":   (18, 20),
    "S3":       (21, 23),
}
PATH_COLOUR      = (0, 150, 255)   # blue-white for path LEDs
PATH_ACTIVE_S    = 30.0            # how long the path stays lit

# ── 16×2 LCD (I2C) ───────────────────────────────────────────────────────
LCD_I2C_ADDRESS = 0x27
LCD_COLS = 16
LCD_ROWS = 2

# ── GM65 QR Scanner (USB HID — appears as keyboard device) ───────────────
QR_DEVICE_PATH = os.environ.get("QR_DEVICE_PATH", "")   # e.g. /dev/input/event0

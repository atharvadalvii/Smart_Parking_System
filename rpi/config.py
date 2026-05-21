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

# ── RCWL-1601 Ultrasonic Slot Sensors (TRIG, ECHO) ────────────────────────
ULTRASONIC = {
    "1": {"trig": 17, "echo": 27},
    "2": {"trig": 22, "echo": 23},
    "3": {"trig": 24, "echo": 25},
}
SENSOR_INTERVAL_S    = 2.0
OCCUPANCY_THRESHOLD_CM = 15

# ── Exit Gate Ultrasonic Sensor ────────────────────────────────────────────
ULTRASONIC_EXIT_GATE = {"trig": 5, "echo": 6}

# ── Entry Gate — VL53L1X Time-of-Flight Laser (I2C) ───────────────────────
VL53L1X_I2C_ADDRESS = 0x29

# ── Servo Motors via PCA9685 I2C Servo Driver (I2C address 0x44) ──────────
PCA9685_I2C_ADDRESS  = 0x44
SERVO_ENTRY_CHANNEL  = 0
SERVO_EXIT_CHANNEL   = 2
SERVO_OPEN_ANGLE     = 85    # degrees
SERVO_CLOSED_ANGLE   = 5     # degrees
GATE_OPEN_S          = 5.0

# ── WS2812B NeoPixel LED Strip (path guidance, GPIO 18) ───────────────────
NEOPIXEL_PIN        = 18
NEOPIXEL_COUNT      = 24
NEOPIXEL_BRIGHTNESS = 0.3
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
PATH_COLOUR   = (0, 150, 255)
PATH_ACTIVE_S = 30.0

# ── LCD Display ST7032 (I2C) ───────────────────────────────────────────────
LCD_I2C_ADDRESS = 0x3E
LCD_COLS = 16
LCD_ROWS = 2

# ── GM65 QR Scanner (USB HID — appears as keyboard device) ───────────────
QR_DEVICE_PATH = os.environ.get("QR_DEVICE_PATH", "")

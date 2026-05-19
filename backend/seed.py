"""
Run once to populate Firestore with 3 parking slots and reset vehicle count.
Usage: python seed.py
"""
from services.firebase import get_db

SLOTS = [
    {"id": "S1", "slot_number": "1", "status": "free", "vehicle_plate": None},
    {"id": "S2", "slot_number": "2", "status": "free", "vehicle_plate": None},
    {"id": "S3", "slot_number": "3", "status": "free", "vehicle_plate": None},
]

def seed():
    db = get_db()
    for slot in SLOTS:
        db.collection("parking_slots").document(slot["id"]).set(slot)
        print(f"Seeded {slot['slot_number']}")

    # Gate-based vehicle counter (IR sensors at entry/exit)
    db.collection("system").document("vehicle_count").set({"count": 0})
    print("Reset vehicle count to 0")
    print("Done — 3 slots created.")

if __name__ == "__main__":
    seed()

from flask import Blueprint, request, jsonify
from datetime import datetime, timezone, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from services.firebase import get_db
import config

def _decode_token(token: str):
    return jwt.decode(token, config.JWT_SECRET_KEY, algorithms=["HS256"])

auth_bp = Blueprint("auth", __name__)


def _make_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
    }
    return jwt.encode(payload, config.JWT_SECRET_KEY, algorithm="HS256")


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    phone = data.get("phone", "").strip()
    license_plate = data.get("license_plate", "").strip()
    password = data.get("password", "")

    if not all([name, email, password]):
        return jsonify({"error": "name, email, and password are required"}), 400

    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 400

    db = get_db()
    existing = db.collection("users").where("email", "==", email).limit(1).get()
    if existing:
        return jsonify({"error": "Email already registered"}), 409

    user_ref = db.collection("users").document()
    user_ref.set({
        "name": name,
        "email": email,
        "phone": phone,
        "license_plate": license_plate,
        "password_hash": generate_password_hash(password),
        "created_at": datetime.now(timezone.utc),
    })

    token = _make_token(user_ref.id)
    return jsonify({"token": token, "user_id": user_ref.id}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not all([email, password]):
        return jsonify({"error": "email and password are required"}), 400

    db = get_db()
    results = db.collection("users").where("email", "==", email).limit(1).get()
    if not results:
        return jsonify({"error": "Invalid credentials"}), 401

    user_doc = results[0]
    user = user_doc.to_dict()
    if not check_password_hash(user["password_hash"], password):
        return jsonify({"error": "Invalid credentials"}), 401

    token = _make_token(user_doc.id)
    return jsonify({"token": token, "user_id": user_doc.id}), 200


@auth_bp.route("/me", methods=["GET"])
def get_me():
    raw = request.headers.get("Authorization", "")
    token = raw.removeprefix("Bearer ").strip()
    if not token:
        return jsonify({"error": "No token provided"}), 401
    try:
        payload = _decode_token(token)
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401

    user_id = payload["sub"]
    db = get_db()
    user_doc = db.collection("users").document(user_id).get()
    if not user_doc.exists:
        return jsonify({"error": "User not found"}), 404

    user = user_doc.to_dict()
    return jsonify({
        "id": user_id,
        "name": user["name"],
        "email": user["email"],
        "phone": user.get("phone", ""),
        "license_plate": user.get("license_plate", ""),
    }), 200

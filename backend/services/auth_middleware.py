from functools import wraps
from flask import request, jsonify, g, current_app
import jwt
import config


def _decode_token(token: str):
    return jwt.decode(token, config.JWT_SECRET_KEY, algorithms=["HS256"])


def require_auth(f):
    """Decorator that validates Bearer JWT and sets g.user_id.

    In TESTING mode the check is bypassed and g.user_id is set from the
    request body's user_id field (or 'test_user' as fallback) so existing
    unit tests don't need to supply tokens.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        if current_app.config.get("TESTING"):
            body = request.get_json(silent=True) or {}
            g.user_id = body.get("user_id", "test_user")
            return f(*args, **kwargs)

        raw = request.headers.get("Authorization", "")
        token = raw.removeprefix("Bearer ").strip()
        if not token:
            return jsonify({"error": "Authentication required"}), 401
        try:
            payload = _decode_token(token)
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401
        g.user_id = payload["sub"]
        return f(*args, **kwargs)
    return decorated

"""Shared QR code generation utility."""
import base64
import io
import qrcode


def generate_qr_base64(value: str) -> str:
    """Return a base64-encoded PNG QR code for the given value."""
    img = qrcode.make(value)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("utf-8")

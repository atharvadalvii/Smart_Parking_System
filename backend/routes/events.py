import json
import queue as queue_module
from flask import Blueprint, Response, stream_with_context
from services.sse_bus import subscribe, unsubscribe

events_bp = Blueprint("events", __name__)


@events_bp.route("/slots")
def slot_events():
    """SSE stream — emits slot status changes as they arrive from MQTT."""
    def generate():
        q = subscribe()
        try:
            while True:
                try:
                    data = q.get(timeout=30)
                    yield f"data: {json.dumps(data)}\n\n"
                except queue_module.Empty:
                    yield ": keepalive\n\n"
        finally:
            unsubscribe(q)

    return Response(
        stream_with_context(generate()),
        content_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )

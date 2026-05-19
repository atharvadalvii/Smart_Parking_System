import os
from flask import Flask
from flask_cors import CORS
from routes.auth import auth_bp
from routes.slots import slots_bp
from routes.bookings import bookings_bp
from routes.payments import payments_bp
from routes.path import path_bp
from routes.events import events_bp

def create_app():
    app = Flask(__name__)
    allowed_origins = os.environ.get("CORS_ORIGINS", "http://localhost:3000").split(",")
    CORS(app, origins=allowed_origins)

    # Start MQTT subscriber only in the main process (not the Flask reloader child)
    if not app.debug or os.environ.get("WERKZEUG_RUN_MAIN") == "true":
        from services.mqtt_client import start_mqtt_client
        start_mqtt_client()

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(slots_bp, url_prefix="/api/slots")
    app.register_blueprint(bookings_bp, url_prefix="/api/bookings")
    app.register_blueprint(payments_bp, url_prefix="/api/payments")
    app.register_blueprint(path_bp, url_prefix="/api/path")
    app.register_blueprint(events_bp, url_prefix="/api/events")

    return app

if __name__ == "__main__":
    app = create_app()
    port = int(os.environ.get("PORT", 5001))
    app.run(debug=True, port=port, threaded=True)

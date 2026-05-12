from flask import Flask
from flask_cors import CORS
from routes.auth import auth_bp
from routes.slots import slots_bp
from routes.bookings import bookings_bp
from routes.payments import payments_bp

def create_app():
    app = Flask(__name__)
    CORS(app, origins=["http://localhost:3000"])

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(slots_bp, url_prefix="/api/slots")
    app.register_blueprint(bookings_bp, url_prefix="/api/bookings")
    app.register_blueprint(payments_bp, url_prefix="/api/payments")

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)

import pytest
from unittest.mock import MagicMock, patch
import os

os.environ.setdefault("STRIPE_SECRET_KEY", "sk_test_fake")
os.environ.setdefault("STRIPE_WEBHOOK_SECRET", "whsec_fake")
os.environ.setdefault("JWT_SECRET_KEY", "test-secret")
os.environ.setdefault("GOOGLE_APPLICATION_CREDENTIALS", "fake_service_account.json")


@pytest.fixture
def mock_db():
    db = MagicMock()
    with (
        patch("routes.auth.get_db", return_value=db),
        patch("routes.slots.get_db", return_value=db),
        patch("routes.bookings.get_db", return_value=db),
        patch("routes.payments.get_db", return_value=db),
        patch("services.mqtt_client.get_db", return_value=db),
    ):
        yield db


@pytest.fixture
def app(mock_db):
    from app import create_app
    application = create_app()
    application.config["TESTING"] = True
    return application


@pytest.fixture
def client(app):
    return app.test_client()

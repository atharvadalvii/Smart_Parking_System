import firebase_admin
from firebase_admin import credentials, firestore
import config

try:
    firebase_admin.get_app()
except ValueError:
    cred = credentials.Certificate(config.GOOGLE_APPLICATION_CREDENTIALS)
    firebase_admin.initialize_app(cred)

_db = firestore.client()

def get_db():
    return _db

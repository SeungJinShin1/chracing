"""Firebase Admin SDK initialization (singleton)."""

import os
import logging
import firebase_admin
from firebase_admin import credentials, firestore

logger = logging.getLogger(__name__)

_db = None


def init_firebase() -> None:
    """Initialize Firebase Admin SDK. Call once at app startup."""
    global _db
    cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "./serviceAccountKey.json")

    if not os.path.exists(cred_path):
        logger.warning(
            f"Firebase credentials file not found at '{cred_path}'. "
            "Set FIREBASE_CREDENTIALS_PATH env variable."
        )
        return

    try:
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        _db = firestore.client()
        logger.info("Firebase Admin SDK initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize Firebase: {e}")
        raise


def get_db() -> firestore.Client:
    """Return the Firestore client singleton."""
    if _db is None:
        raise RuntimeError(
            "Firebase is not initialized. Call init_firebase() first."
        )
    return _db

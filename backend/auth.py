"""API Key authentication middleware for FastAPI."""

import os
from fastapi import HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

security = HTTPBearer()

API_SECRET_KEY = os.getenv("API_SECRET_KEY", "change-this-to-a-secure-random-string")


async def verify_api_key(
    credentials: HTTPAuthorizationCredentials = Security(security),
) -> str:
    """
    Verify the Bearer token from the Authorization header.
    Raises 401 if the token is missing or invalid.
    """
    if credentials.credentials != API_SECRET_KEY:
        raise HTTPException(
            status_code=401,
            detail="Invalid or missing API key",
        )
    return credentials.credentials

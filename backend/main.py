"""
CH Racing Backend — FastAPI Application

All Firebase write/delete operations are exclusively handled here.
Every endpoint is protected by API Key Bearer token authentication.
"""

import logging
from datetime import datetime, timezone
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from google.cloud.firestore_v1.base_query import FieldFilter

from auth import verify_api_key
from firebase_client import init_firebase, get_db
from models import RecordCreate, RecordResponse, UserCreate, UserResponse

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------
load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("chracing-backend")


# ---------------------------------------------------------------------------
# Lifespan (startup / shutdown)
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize Firebase on startup."""
    logger.info("Starting CH Racing Backend...")
    init_firebase()
    logger.info("Backend ready.")
    yield
    logger.info("Shutting down CH Racing Backend.")


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="CH Racing API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Global Exception Handler
# ---------------------------------------------------------------------------
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch all unhandled exceptions so the server never crashes."""
    logger.error(f"Unhandled error on {request.method} {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Check server logs for details."},
    )


# ---------------------------------------------------------------------------
# Health Check
# ---------------------------------------------------------------------------
@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "chracing-backend"}


# ---------------------------------------------------------------------------
# POST /api/records — Save & validate a racing record
# ---------------------------------------------------------------------------
@app.post("/api/records", response_model=RecordResponse)
async def create_record(
    body: RecordCreate,
    _: str = Depends(verify_api_key),
):
    """
    Save a lap time record.
    1. Validate UID exists in users collection.
    2. Reject lapTime < 2.0s as abnormal.
    3. Add to records collection.
    4. Update bestTime in users collection if improved.
    """
    db = get_db()

    # 1) UID validation
    user_ref = db.collection("users").document(body.uid)
    user_doc = user_ref.get()
    if not user_doc.exists:
        raise HTTPException(
            status_code=404,
            detail=f"User with UID '{body.uid}' not found. Register first.",
        )

    # 2) Abnormal time check
    if body.lapTime < 2.0:
        raise HTTPException(
            status_code=400,
            detail=f"Lap time {body.lapTime}s is below 2.0s minimum — flagged as abnormal.",
        )

    # 3) Save record
    now = datetime.now(timezone.utc).isoformat()
    db.collection("records").add({
        "uid": body.uid,
        "lapTime": body.lapTime,
        "timestamp": now,
    })
    logger.info(f"Record saved: uid={body.uid}, lapTime={body.lapTime}")

    # 4) Update bestTime if improved
    user_data = user_doc.to_dict()
    current_best = user_data.get("bestTime", 999.99)
    is_new_best = body.lapTime < current_best

    if is_new_best:
        user_ref.update({"bestTime": body.lapTime})
        logger.info(f"New best time for {body.uid}: {body.lapTime}s (was {current_best}s)")

    return RecordResponse(
        success=True,
        message="New best time!" if is_new_best else "Record saved.",
        lapTime=body.lapTime,
        isNewBest=is_new_best,
    )


# ---------------------------------------------------------------------------
# POST /api/users — Register a new user
# ---------------------------------------------------------------------------
@app.post("/api/users", response_model=UserResponse)
async def create_user(
    body: UserCreate,
    _: str = Depends(verify_api_key),
):
    """Register a new user with NFC UID as the document ID."""
    db = get_db()

    # Check if user already exists
    user_ref = db.collection("users").document(body.uid)
    if user_ref.get().exists:
        raise HTTPException(
            status_code=409,
            detail=f"User with UID '{body.uid}' already exists.",
        )

    now = datetime.now(timezone.utc).isoformat()
    user_data = {
        "name": body.name,
        "bestTime": 999.99,
        "musicUrl": body.musicUrl,
        "createdAt": now,
    }
    user_ref.set(user_data)
    logger.info(f"User created: uid={body.uid}, name={body.name}")

    return UserResponse(uid=body.uid, **user_data)


# ---------------------------------------------------------------------------
# GET /api/users — List all users
# ---------------------------------------------------------------------------
@app.get("/api/users", response_model=list[UserResponse])
async def list_users(
    _: str = Depends(verify_api_key),
):
    """Return all users ordered by bestTime ascending."""
    db = get_db()
    users = db.collection("users").order_by("bestTime").stream()

    result = []
    for doc in users:
        data = doc.to_dict()
        result.append(UserResponse(uid=doc.id, **data))

    return result


# ---------------------------------------------------------------------------
# DELETE /api/users/{uid} — Atomic delete user + all their records
# ---------------------------------------------------------------------------
@app.delete("/api/users/{uid}")
async def delete_user(
    uid: str,
    _: str = Depends(verify_api_key),
):
    """
    Atomically delete a user and ALL their records using Firestore batch.
    Prevents orphaned data.
    """
    db = get_db()
    batch = db.batch()

    # 1) Delete user document
    user_ref = db.collection("users").document(uid)
    if not user_ref.get().exists:
        raise HTTPException(status_code=404, detail=f"User '{uid}' not found.")

    batch.delete(user_ref)

    # 2) Find and delete all records for this UID
    records = (
        db.collection("records")
        .where(filter=FieldFilter("uid", "==", uid))
        .stream()
    )
    record_count = 0
    for record_doc in records:
        batch.delete(record_doc.reference)
        record_count += 1

    # 3) Commit atomically
    batch.commit()
    logger.info(f"Deleted user '{uid}' and {record_count} associated records.")

    return {
        "success": True,
        "message": f"User and {record_count} records deleted.",
    }


# ---------------------------------------------------------------------------
# Run with: uvicorn main:app --reload --port 8000
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

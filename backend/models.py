"""Pydantic models for request/response validation."""

from pydantic import BaseModel, Field


class RecordCreate(BaseModel):
    """Request body for creating a racing record."""
    uid: str = Field(..., min_length=1, description="NFC tag UID")
    lapTime: float = Field(..., gt=0, description="Lap time in seconds")


class UserCreate(BaseModel):
    """Request body for creating a new user."""
    uid: str = Field(..., min_length=1, description="NFC tag UID (used as document ID)")
    name: str = Field(..., min_length=1, description="Student name")
    musicUrl: str = Field(default="", description="AI music URL")


class RecordResponse(BaseModel):
    """Response after creating a record."""
    success: bool
    message: str
    lapTime: float | None = None
    isNewBest: bool = False


class UserResponse(BaseModel):
    """Response for user data."""
    uid: str
    name: str
    bestTime: float
    musicUrl: str
    createdAt: str


class ErrorResponse(BaseModel):
    """Standard error response."""
    detail: str

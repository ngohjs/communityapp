from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    email: EmailStr
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    password: str = Field(min_length=8, max_length=128)


class RegisterResponse(BaseModel):
    id: str
    email: EmailStr
    first_name: str
    last_name: str
    status: str
    created_at: Optional[datetime]
    verification_token: str


class VerifyEmailResponse(BaseModel):
    id: str
    email: EmailStr
    status: str
    verified: bool


class UserSummary(BaseModel):
    id: str
    email: EmailStr
    first_name: str
    last_name: str
    status: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    refresh_expires_at: datetime
    user: UserSummary


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)


class MessageResponse(BaseModel):
    message: str

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field, constr


PhoneNumber = constr(pattern=r"^\+?[1-9]\d{7,14}$")


class ProfileResponse(BaseModel):
    id: str
    email: EmailStr
    first_name: str
    last_name: str
    phone: Optional[str]
    bio: Optional[str]
    location: Optional[str]
    interests: Optional[List[str]] = None
    avatar_path: Optional[str]
    last_completed_at: Optional[datetime]
    updated_at: Optional[datetime]
    privacy_level: Optional[str]
    notify_content: Optional[bool]
    notify_community: Optional[bool]
    notify_account: Optional[bool]


class ProfileUpdateRequest(BaseModel):
    first_name: Optional[constr(min_length=1, max_length=100)] = None
    last_name: Optional[constr(min_length=1, max_length=100)] = None
    phone: Optional[PhoneNumber] = None
    bio: Optional[constr(max_length=500)] = None
    location: Optional[constr(max_length=255)] = None
    interests: Optional[List[constr(min_length=1, max_length=64)]] = Field(default=None)


class ProfileUpdateResponse(ProfileResponse):
    message: str = "Profile updated successfully"


class PrivacyUpdateRequest(BaseModel):
    privacy_level: constr(pattern=r"^(private|community|admin)$")


class PrivacyUpdateResponse(ProfileResponse):
    message: str = "Privacy preferences updated"


class PreferencesUpdateRequest(BaseModel):
    notify_content: Optional[bool] = None
    notify_community: Optional[bool] = None
    notify_account: Optional[bool] = None


class PreferencesUpdateResponse(ProfileResponse):
    message: str = "Preferences updated"

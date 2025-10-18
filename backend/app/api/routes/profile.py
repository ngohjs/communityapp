from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from ...dependencies import get_current_user
from ...database import get_db
from ...models.preference import PrivacyLevel
from ...models.user import User
from ...schemas.profile import (
    ProfileResponse,
    ProfileUpdateRequest,
    ProfileUpdateResponse,
    PrivacyUpdateRequest,
    PrivacyUpdateResponse,
    PreferencesUpdateRequest,
    PreferencesUpdateResponse,
)
from ...services.profile_service import ProfileService


def _load_user_with_profile(db: Session, user_id) -> User:
    user = db.get(User, user_id)
    if not user:
        return None
    ProfileService.get_profile(db, user)
    ProfileService.ensure_preferences(db, user)
    db.refresh(user)
    return user


router = APIRouter(prefix="/profile", tags=["profile"])


def _serialize_profile(user: User) -> ProfileResponse:
    profile = user.profile
    preferences = user.preferences
    interests = profile.interests if profile and profile.interests else None
    if isinstance(interests, list):
        interests_list = interests
    elif isinstance(interests, dict):
        interests_list = interests.get("items") if isinstance(interests.get("items"), list) else None
    else:
        interests_list = None

    return ProfileResponse(
        id=str(user.id),
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        phone=user.phone,
        bio=profile.bio if profile else None,
        location=profile.location if profile else None,
        interests=interests_list,
        avatar_path=profile.avatar_path if profile else None,
        last_completed_at=profile.last_completed_at if profile else None,
        updated_at=profile.updated_at if profile else None,
        privacy_level=preferences.privacy_level if preferences else None,
        notify_content=preferences.notify_content if preferences else None,
        notify_community=preferences.notify_community if preferences else None,
        notify_account=preferences.notify_account if preferences else None,
    )


@router.get("/me", response_model=ProfileResponse)
def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProfileResponse:
    refreshed = _load_user_with_profile(db, current_user.id)
    return _serialize_profile(refreshed)


@router.patch("/me", response_model=ProfileUpdateResponse)
def update_my_profile(
    payload: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProfileUpdateResponse:
    interests = payload.interests
    try:
        profile = ProfileService.update_profile(
            db,
            user=current_user,
            first_name=payload.first_name,
            last_name=payload.last_name,
            phone=payload.phone,
            bio=payload.bio,
            location=payload.location,
            interests=interests,
        )
    except ValueError as exc:
        if str(exc) == "phone_in_use":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Phone already in use")
        raise

    refreshed = _load_user_with_profile(db, current_user.id)
    return ProfileUpdateResponse(
        **_serialize_profile(refreshed).model_dump(),
    )


@router.post("/me/avatar", response_model=ProfileUpdateResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProfileUpdateResponse:
    if file.content_type not in {"image/png", "image/jpeg", "image/jpg"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported file type")

    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File exceeds 5MB limit")

    extension = "png" if file.content_type == "image/png" else "jpg"

    try:
        ProfileService.update_avatar(
            db,
            user=current_user,
            file_bytes=contents,
            extension=extension,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    db.refresh(current_user)
    refreshed = _load_user_with_profile(db, current_user.id)
    return ProfileUpdateResponse(
        **_serialize_profile(refreshed).model_dump(),
    )


@router.patch("/me/privacy", response_model=PrivacyUpdateResponse)
def update_privacy(
    payload: PrivacyUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PrivacyUpdateResponse:
    try:
        privacy_level = PrivacyLevel(payload.privacy_level)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid privacy level") from exc

    preferences = ProfileService.update_privacy(
        db,
        user=current_user,
        privacy_level=privacy_level,
    )

    refreshed = _load_user_with_profile(db, current_user.id)
    return PrivacyUpdateResponse(
        **_serialize_profile(refreshed).model_dump(),
    )


@router.patch("/me/preferences", response_model=PreferencesUpdateResponse)
def update_preferences(
    payload: PreferencesUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PreferencesUpdateResponse:
    preferences = ProfileService.update_notification_preferences(
        db,
        user=current_user,
        notify_content=payload.notify_content,
        notify_community=payload.notify_community,
        notify_account=payload.notify_account,
    )

    refreshed = _load_user_with_profile(db, current_user.id)
    return PreferencesUpdateResponse(
        **_serialize_profile(refreshed).model_dump(),
    )


@router.get("/{user_id}", response_model=ProfileResponse)
def get_profile_detail(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProfileResponse:
    try:
        target_uuid = UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user id")

    target = _load_user_with_profile(db, target_uuid)
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if target.id == current_user.id:
        return _serialize_profile(target)

    preferences = target.preferences
    privacy_level = PrivacyLevel(preferences.privacy_level) if preferences else PrivacyLevel.private

    if privacy_level == PrivacyLevel.private and not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Profile is private")

    if privacy_level == PrivacyLevel.admin and not (current_user.is_admin):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")

    return _serialize_profile(target)

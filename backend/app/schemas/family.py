"""
Family schemas
"""

from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from app.models.family import FamilyRole


class FamilyBase(BaseModel):
    name: str


class FamilyCreate(FamilyBase):
    pass


class FamilyUpdate(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None


class FamilyResponse(FamilyBase):
    id: int
    created_by: int
    created_at: datetime
    updated_at: datetime
    is_active: bool

    class Config:
        from_attributes = True


class FamilyMemberCreate(BaseModel):
    email: EmailStr
    role: FamilyRole = FamilyRole.VIEWER
    can_view_all_accounts: bool = True
    can_edit_accounts: bool = False
    can_invite_members: bool = False
    can_export_reports: bool = False


class FamilyMemberUpdate(BaseModel):
    role: Optional[FamilyRole] = None
    can_view_all_accounts: Optional[bool] = None
    can_edit_accounts: Optional[bool] = None
    can_invite_members: Optional[bool] = None
    can_export_reports: Optional[bool] = None
    is_active: Optional[bool] = None


class FamilyMemberResponse(BaseModel):
    id: int
    family_id: int
    user_id: int
    role: FamilyRole
    can_view_all_accounts: bool
    can_edit_accounts: bool
    can_invite_members: bool
    can_export_reports: bool
    is_active: bool
    invited_at: datetime
    joined_at: Optional[datetime] = None
    user: Optional[dict] = None  # UserResponse nested

    class Config:
        from_attributes = True


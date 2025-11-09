"""
Family management endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
import secrets
import string
import logging

from app.core.database import get_db
from app.api.v1.dependencies import get_current_user
from app.schemas.family import (
    FamilyCreate,
    FamilyUpdate,
    FamilyResponse,
    FamilyMemberCreate,
    FamilyMemberUpdate,
    FamilyMemberResponse
)
from app.schemas.user import UserResponse
from app.models.user import User
from app.models.family import Family, FamilyMember, FamilyRole
from app.core.security import get_password_hash, create_invitation_token
from app.core.email import send_invitation_email
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("", response_model=FamilyResponse, status_code=status.HTTP_201_CREATED)
async def create_family(
    family_data: FamilyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new family"""
    family = Family(
        name=family_data.name,
        created_by=current_user.id
    )
    db.add(family)
    db.commit()
    db.refresh(family)
    
    # Add creator as owner
    member = FamilyMember(
        family_id=family.id,
        user_id=current_user.id,
        role=FamilyRole.OWNER,
        can_view_all_accounts=True,
        can_edit_accounts=True,
        can_invite_members=True,
        can_export_reports=True,
        joined_at=family.created_at
    )
    db.add(member)
    db.commit()
    
    return family


@router.get("", response_model=List[FamilyResponse])
async def get_families(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all families user is a member of"""
    families = db.query(Family).join(FamilyMember).filter(
        FamilyMember.user_id == current_user.id,
        FamilyMember.is_active == True,
        Family.is_active == True
    ).all()
    
    return families


@router.get("/{family_id}", response_model=FamilyResponse)
async def get_family(
    family_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get family details"""
    # Check if user is member
    member = db.query(FamilyMember).filter(
        FamilyMember.family_id == family_id,
        FamilyMember.user_id == current_user.id,
        FamilyMember.is_active == True
    ).first()
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this family"
        )
    
    family = db.query(Family).filter(Family.id == family_id).first()
    if not family:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Family not found"
        )
    
    return family


@router.patch("/{family_id}", response_model=FamilyResponse)
async def update_family(
    family_id: int,
    family_update: FamilyUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update family (only owner)"""
    # Check if user is owner
    member = db.query(FamilyMember).filter(
        FamilyMember.family_id == family_id,
        FamilyMember.user_id == current_user.id,
        FamilyMember.role == FamilyRole.OWNER,
        FamilyMember.is_active == True
    ).first()
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only family owner can update family"
        )
    
    family = db.query(Family).filter(Family.id == family_id).first()
    if not family:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Family not found"
        )
    
    update_data = family_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(family, field, value)
    
    db.commit()
    db.refresh(family)
    
    return family


@router.get("/{family_id}/members", response_model=List[FamilyMemberResponse])
async def get_family_members(
    family_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get family members"""
    # Check if user is member
    member = db.query(FamilyMember).filter(
        FamilyMember.family_id == family_id,
        FamilyMember.user_id == current_user.id,
        FamilyMember.is_active == True
    ).first()
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this family"
        )
    
    members = db.query(FamilyMember).options(
        joinedload(FamilyMember.user)
    ).filter(
        FamilyMember.family_id == family_id,
        FamilyMember.is_active == True
    ).all()
    
    # Convert to response format with user data
    result = []
    for member in members:
        member_dict = {
            "id": member.id,
            "family_id": member.family_id,
            "user_id": member.user_id,
            "role": member.role,
            "can_view_all_accounts": member.can_view_all_accounts,
            "can_edit_accounts": member.can_edit_accounts,
            "can_invite_members": member.can_invite_members,
            "can_export_reports": member.can_export_reports,
            "is_active": member.is_active,
            "invited_at": member.invited_at,
            "joined_at": member.joined_at,
            "user": {
                "id": member.user.id,
                "email": member.user.email,
                "phone": member.user.phone,
                "full_name": member.user.full_name,
                "is_active": member.user.is_active,
                "is_verified": member.user.is_verified,
                "two_factor_enabled": member.user.two_factor_enabled,
                "created_at": member.user.created_at,
                "last_login": member.user.last_login,
            } if member.user else None
        }
        result.append(member_dict)
    
    return result


@router.post("/{family_id}/members", response_model=FamilyMemberResponse, status_code=status.HTTP_201_CREATED)
async def invite_member(
    family_id: int,
    member_data: FamilyMemberCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Invite a member to family"""
    # Check if user can invite
    member = db.query(FamilyMember).filter(
        FamilyMember.family_id == family_id,
        FamilyMember.user_id == current_user.id,
        FamilyMember.is_active == True
    ).first()
    
    if not member or not member.can_invite_members:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to invite members"
        )
    
    # Find or create user by email
    user = db.query(User).filter(User.email == member_data.email).first()
    is_new_user = False
    
    if not user:
        # Create new user with temporary password
        # Generate a secure random password (user will set their own via invitation link)
        temp_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(32))
        hashed_password = get_password_hash(temp_password)
        
        # Generate a unique temporary phone number based on email hash
        # This ensures uniqueness while user updates it later via invitation link
        import hashlib
        email_hash = hashlib.md5(member_data.email.encode()).hexdigest()[:10]
        temp_phone = f"+1{email_hash}"  # Format: +1 followed by 10 hex digits
        
        # Ensure phone is unique
        existing_phone = db.query(User).filter(User.phone == temp_phone).first()
        counter = 0
        while existing_phone:
            counter += 1
            temp_phone = f"+1{email_hash}{counter:02d}"[:13]  # Max 13 chars
            existing_phone = db.query(User).filter(User.phone == temp_phone).first()
        
        user = User(
            email=member_data.email,
            phone=temp_phone,
            hashed_password=hashed_password,
            is_active=True,
            is_verified=False  # User needs to verify via invitation link
        )
        db.add(user)
        db.flush()  # Flush to get user.id without committing
        is_new_user = True
    
    # Check if already a member
    existing_member = db.query(FamilyMember).filter(
        FamilyMember.family_id == family_id,
        FamilyMember.user_id == user.id
    ).first()
    
    if existing_member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already a member of this family"
        )
    
    # Get family name for email
    family = db.query(Family).filter(Family.id == family_id).first()
    family_name = family.name if family else "the family"
    
    # Get inviter name
    inviter_name = current_user.full_name or current_user.email
    
    # Create member
    new_member = FamilyMember(
        family_id=family_id,
        user_id=user.id,
        role=member_data.role,
        invited_by=current_user.id,
        can_view_all_accounts=member_data.can_view_all_accounts,
        can_edit_accounts=member_data.can_edit_accounts,
        can_invite_members=member_data.can_invite_members,
        can_export_reports=member_data.can_export_reports
    )
    db.add(new_member)
    db.commit()
    db.refresh(new_member)
    
    # Generate invitation token
    invitation_token = create_invitation_token(family_id, user.id, user.email)
    
    # Send invitation email
    email_sent = await send_invitation_email(
        to_email=user.email,
        inviter_name=inviter_name,
        family_name=family_name,
        invitation_token=invitation_token,
        is_new_user=is_new_user
    )
    
    if not email_sent:
        logger.warning(f"Failed to send invitation email to {user.email}, but member was created successfully")
    
    # Convert to response format with user data
    member_dict = {
        "id": new_member.id,
        "family_id": new_member.family_id,
        "user_id": new_member.user_id,
        "role": new_member.role,
        "can_view_all_accounts": new_member.can_view_all_accounts,
        "can_edit_accounts": new_member.can_edit_accounts,
        "can_invite_members": new_member.can_invite_members,
        "can_export_reports": new_member.can_export_reports,
        "is_active": new_member.is_active,
        "invited_at": new_member.invited_at,
        "joined_at": new_member.joined_at,
        "user": {
            "id": user.id,
            "email": user.email,
            "phone": user.phone,
            "full_name": user.full_name,
            "is_active": user.is_active,
            "is_verified": user.is_verified,
            "two_factor_enabled": user.two_factor_enabled,
            "created_at": user.created_at,
            "last_login": user.last_login,
        } if user else None
    }
    
    return member_dict


@router.patch("/{family_id}/members/{member_id}", response_model=FamilyMemberResponse)
async def update_member(
    family_id: int,
    member_id: int,
    member_update: FamilyMemberUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update family member (only owner)"""
    # Check if user is owner
    member = db.query(FamilyMember).filter(
        FamilyMember.family_id == family_id,
        FamilyMember.user_id == current_user.id,
        FamilyMember.role == FamilyRole.OWNER,
        FamilyMember.is_active == True
    ).first()
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only family owner can update members"
        )
    
    target_member = db.query(FamilyMember).filter(
        FamilyMember.id == member_id,
        FamilyMember.family_id == family_id
    ).first()
    
    if not target_member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found"
        )
    
    update_data = member_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(target_member, field, value)
    
    db.commit()
    db.refresh(target_member)
    
    return target_member


@router.delete("/{family_id}/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    family_id: int,
    member_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a member from family (only owner)"""
    # Check if user is owner
    member = db.query(FamilyMember).filter(
        FamilyMember.family_id == family_id,
        FamilyMember.user_id == current_user.id,
        FamilyMember.role == FamilyRole.OWNER,
        FamilyMember.is_active == True
    ).first()
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only family owner can remove members"
        )
    
    target_member = db.query(FamilyMember).filter(
        FamilyMember.id == member_id,
        FamilyMember.family_id == family_id
    ).first()
    
    if not target_member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found"
        )
    
    # Prevent owner from removing themselves
    if target_member.user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove yourself from the family"
        )
    
    # Soft delete by setting is_active to False
    target_member.is_active = False
    db.commit()
    
    return None


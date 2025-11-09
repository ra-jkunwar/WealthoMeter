"""
Family and FamilyMember models
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.core.database import Base


class FamilyRole(str, enum.Enum):
    """Family member roles"""
    OWNER = "owner"
    EDITOR = "editor"
    VIEWER = "viewer"
    ADVISOR = "advisor"


class Family(Base):
    __tablename__ = "families"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    members = relationship("FamilyMember", back_populates="family", cascade="all, delete-orphan")
    accounts = relationship("Account", back_populates="family", cascade="all, delete-orphan")


class FamilyMember(Base):
    __tablename__ = "family_members"

    id = Column(Integer, primary_key=True, index=True)
    family_id = Column(Integer, ForeignKey("families.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(SQLEnum(FamilyRole), default=FamilyRole.VIEWER, nullable=False)
    invited_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    invited_at = Column(DateTime, default=datetime.utcnow)
    joined_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Permissions (can be extended)
    can_view_all_accounts = Column(Boolean, default=True)
    can_edit_accounts = Column(Boolean, default=False)
    can_invite_members = Column(Boolean, default=False)
    can_export_reports = Column(Boolean, default=False)
    
    # Relationships
    family = relationship("Family", back_populates="members")
    user = relationship("User", back_populates="families", foreign_keys=[user_id])


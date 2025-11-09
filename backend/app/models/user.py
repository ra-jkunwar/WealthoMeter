"""
User model
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base


def _get_family_member_user_id():
    """Helper function to get FamilyMember.user_id column for foreign_keys"""
    from app.models.family import FamilyMember
    return [FamilyMember.user_id]


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(20), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    two_factor_enabled = Column(Boolean, default=False)
    two_factor_secret = Column(String(255), nullable=True)  # Encrypted
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    
    # KYC fields (optional)
    pan_number = Column(String(10), nullable=True)
    aadhaar_last_4 = Column(String(4), nullable=True)
    
    # Relationships
    families = relationship(
        "FamilyMember",
        back_populates="user",
        foreign_keys=_get_family_member_user_id,
        cascade="all, delete-orphan"
    )
    accounts = relationship("Account", back_populates="owner", cascade="all, delete-orphan")


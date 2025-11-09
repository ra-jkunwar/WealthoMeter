"""
Consent log model for Account Aggregator compliance
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.core.database import Base


class ConsentStatus(str, enum.Enum):
    """Consent status"""
    PENDING = "pending"
    ACTIVE = "active"
    EXPIRED = "expired"
    REVOKED = "revoked"
    REJECTED = "rejected"


class ConsentLog(Base):
    __tablename__ = "consent_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=True)
    
    # Consent details
    consent_id = Column(String(255), unique=True, index=True, nullable=False)  # AA consent ID
    provider = Column(String(50), nullable=False)  # AA provider name
    status = Column(SQLEnum(ConsentStatus), default=ConsentStatus.PENDING)
    
    # Consent scope
    consent_scope = Column(Text, nullable=True)  # JSON string of consented data types
    consent_purpose = Column(String(255), nullable=True)
    
    # Timestamps
    consented_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    revoked_at = Column(DateTime, nullable=True)
    
    # Metadata
    consent_metadata = Column(Text, nullable=True)  # JSON string for additional data
    
    # Audit
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(255), nullable=True)


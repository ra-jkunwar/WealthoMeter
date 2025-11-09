"""
Consent management service for Account Aggregator compliance
"""

from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.models.consent import ConsentLog, ConsentStatus
from app.models.account import Account
from app.core.config import settings


class ConsentService:
    """Service for managing consent logs"""
    
    @staticmethod
    def create_consent(
        db: Session,
        user_id: int,
        account_id: Optional[int],
        consent_id: str,
        provider: str,
        consent_scope: Dict[str, Any],
        expires_in_days: int = 90
    ) -> ConsentLog:
        """Create a new consent log entry"""
        consent = ConsentLog(
            user_id=user_id,
            account_id=account_id,
            consent_id=consent_id,
            provider=provider,
            status=ConsentStatus.ACTIVE,
            consent_scope=str(consent_scope),
            consented_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(days=expires_in_days)
        )
        
        db.add(consent)
        db.commit()
        db.refresh(consent)
        
        return consent
    
    @staticmethod
    def revoke_consent(
        db: Session,
        consent_id: str
    ) -> ConsentLog:
        """Revoke a consent"""
        consent = db.query(ConsentLog).filter(
            ConsentLog.consent_id == consent_id
        ).first()
        
        if not consent:
            raise ValueError("Consent not found")
        
        consent.status = ConsentStatus.REVOKED
        consent.revoked_at = datetime.utcnow()
        
        db.commit()
        db.refresh(consent)
        
        return consent
    
    @staticmethod
    def check_consent_validity(
        db: Session,
        user_id: int,
        account_id: int
    ) -> bool:
        """Check if user has valid consent for account"""
        consent = db.query(ConsentLog).filter(
            ConsentLog.user_id == user_id,
            ConsentLog.account_id == account_id,
            ConsentLog.status == ConsentStatus.ACTIVE,
            ConsentLog.expires_at > datetime.utcnow()
        ).first()
        
        return consent is not None
    
    @staticmethod
    def get_user_consents(
        db: Session,
        user_id: int
    ) -> list[ConsentLog]:
        """Get all consents for a user"""
        consents = db.query(ConsentLog).filter(
            ConsentLog.user_id == user_id
        ).order_by(ConsentLog.created_at.desc()).all()
        
        return consents


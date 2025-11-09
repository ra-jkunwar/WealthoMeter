"""
Account model - represents linked accounts (banks, credit cards, FDs, MFs, stocks)
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Numeric, Enum as SQLEnum, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.core.database import Base


class AccountType(str, enum.Enum):
    """Account types"""
    SAVINGS = "savings"
    CURRENT = "current"
    CREDIT_CARD = "credit_card"
    FIXED_DEPOSIT = "fixed_deposit"
    MUTUAL_FUND = "mutual_fund"
    STOCK = "stock"
    DEBT = "debt"
    COLLECTION = "collection"


class AccountStatus(str, enum.Enum):
    """Account linking status"""
    PENDING = "pending"
    LINKED = "linked"
    ERROR = "error"
    EXPIRED = "expired"
    DISCONNECTED = "disconnected"


class AccountProvider(str, enum.Enum):
    """Account linking providers"""
    MANUAL = "manual"
    ACCOUNT_AGGREGATOR = "account_aggregator"
    ZERODHA = "zerodha"
    UPSTOX = "upstox"
    CAMS = "cams"
    KFIN = "kfin"
    CSV_IMPORT = "csv_import"
    PDF_IMPORT = "pdf_import"


class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    family_id = Column(Integer, ForeignKey("families.id"), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Account details
    name = Column(String(255), nullable=False)  # e.g., "HDFC Savings", "Zerodha Demat"
    account_type = Column(SQLEnum(AccountType), nullable=False)
    provider = Column(SQLEnum(AccountProvider), default=AccountProvider.MANUAL)
    status = Column(SQLEnum(AccountStatus), default=AccountStatus.PENDING)
    
    # Account identifiers (masked/stored securely)
    account_number_last_4 = Column(String(4), nullable=True)
    account_identifier = Column(String(255), nullable=True)  # Masked identifier
    
    # Balance and holdings
    current_balance = Column(Numeric(15, 2), default=0.0)
    currency = Column(String(3), default="INR")
    
    # Provider-specific data (encrypted)
    provider_credentials = Column(Text, nullable=True)  # Encrypted JSON
    provider_account_id = Column(String(255), nullable=True)
    
    # Metadata
    account_metadata = Column(JSON, nullable=True)  # Additional account-specific data
    
    # Sync information
    last_synced_at = Column(DateTime, nullable=True)
    sync_frequency_hours = Column(Integer, default=24)
    sync_error = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    family = relationship("Family", back_populates="accounts")
    owner = relationship("User", back_populates="accounts")
    transactions = relationship("Transaction", back_populates="account", cascade="all, delete-orphan")


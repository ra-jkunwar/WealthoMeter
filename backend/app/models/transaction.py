"""
Transaction model
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Numeric, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.core.database import Base


class TransactionType(str, enum.Enum):
    """Transaction types"""
    CREDIT = "credit"
    DEBIT = "debit"
    TRANSFER = "transfer"
    INVESTMENT = "investment"
    REDEMPTION = "redemption"
    DIVIDEND = "dividend"
    INTEREST = "interest"
    FEE = "fee"


class TransactionCategory(str, enum.Enum):
    """Transaction categories"""
    FOOD = "food"
    TRANSPORT = "transport"
    SHOPPING = "shopping"
    BILLS = "bills"
    ENTERTAINMENT = "entertainment"
    HEALTHCARE = "healthcare"
    EDUCATION = "education"
    INVESTMENT = "investment"
    SALARY = "salary"
    TRANSFER = "transfer"
    OTHER = "other"


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    
    # Transaction details
    transaction_id = Column(String(255), unique=True, index=True, nullable=False)  # Provider transaction ID
    transaction_date = Column(DateTime, nullable=False, index=True)
    amount = Column(Numeric(15, 2), nullable=False)
    currency = Column(String(3), default="INR")
    transaction_type = Column(SQLEnum(TransactionType), nullable=False)
    category = Column(SQLEnum(TransactionCategory), default=TransactionCategory.OTHER)
    
    # Description
    description = Column(Text, nullable=True)
    merchant_name = Column(String(255), nullable=True)
    reference_number = Column(String(255), nullable=True)
    
    # Balance after transaction
    balance_after = Column(Numeric(15, 2), nullable=True)
    
    # Metadata
    transaction_metadata = Column(Text, nullable=True)  # JSON string for additional data
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    account = relationship("Account", back_populates="transactions")


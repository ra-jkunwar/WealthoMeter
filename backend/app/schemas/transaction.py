"""
Transaction schemas
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal
from app.models.transaction import TransactionType, TransactionCategory


class TransactionBase(BaseModel):
    transaction_date: datetime
    amount: Decimal
    transaction_type: TransactionType
    category: TransactionCategory = TransactionCategory.OTHER
    description: Optional[str] = None
    merchant_name: Optional[str] = None
    reference_number: Optional[str] = None


class TransactionCreate(TransactionBase):
    account_id: int
    transaction_id: str  # Provider transaction ID
    currency: str = "INR"
    balance_after: Optional[Decimal] = None
    metadata: Optional[str] = None


class TransactionUpdate(BaseModel):
    category: Optional[TransactionCategory] = None
    description: Optional[str] = None
    merchant_name: Optional[str] = None
    is_active: Optional[bool] = None


class TransactionResponse(TransactionBase):
    id: int
    account_id: int
    transaction_id: str
    currency: str
    balance_after: Optional[Decimal] = None
    created_at: datetime
    updated_at: datetime
    is_active: bool

    class Config:
        from_attributes = True


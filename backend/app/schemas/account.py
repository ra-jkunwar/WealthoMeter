"""
Account schemas
"""

from pydantic import BaseModel, Field, model_serializer
from typing import Optional, Dict, Any
from datetime import datetime
from decimal import Decimal
from app.models.account import AccountType, AccountStatus, AccountProvider


class AccountBase(BaseModel):
    name: str
    account_type: AccountType
    provider: AccountProvider = AccountProvider.MANUAL


class AccountCreate(AccountBase):
    family_id: int
    account_number_last_4: Optional[str] = None
    current_balance: Optional[Decimal] = 0.0
    currency: str = "INR"
    metadata: Optional[Dict[str, Any]] = None


class AccountUpdate(BaseModel):
    name: Optional[str] = None
    current_balance: Optional[Decimal] = None
    status: Optional[AccountStatus] = None
    metadata: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class AccountResponse(AccountBase):
    id: int
    family_id: int
    owner_id: int
    status: AccountStatus
    account_number_last_4: Optional[str] = None
    current_balance: Decimal
    currency: str
    last_synced_at: Optional[datetime] = None
    sync_error: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    is_active: bool
    account_metadata: Optional[Dict[str, Any]] = Field(None, serialization_alias="metadata")

    @model_serializer
    def serialize_model(self):
        data = dict(self)
        # Map account_metadata to metadata in response
        if 'account_metadata' in data:
            data['metadata'] = data.pop('account_metadata')
        return data

    class Config:
        from_attributes = True
        populate_by_name = True


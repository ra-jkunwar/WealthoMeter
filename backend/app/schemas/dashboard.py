"""
Dashboard schemas
"""

from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime
from decimal import Decimal


class NetWorthResponse(BaseModel):
    total_net_worth: Decimal
    total_assets: Decimal
    total_liabilities: Decimal
    currency: str = "INR"
    last_updated: datetime


class AssetAllocationItem(BaseModel):
    account_type: str
    amount: Decimal
    percentage: float


class AssetAllocationResponse(BaseModel):
    allocation: List[AssetAllocationItem]
    currency: str = "INR"


class MemberNetWorth(BaseModel):
    user_id: int
    user_name: str
    net_worth: Decimal
    accounts_count: int


class TopMover(BaseModel):
    account_id: int
    account_name: str
    change_amount: Decimal
    change_percentage: float
    change_type: str  # "increase" or "decrease"


class Alert(BaseModel):
    type: str  # "credit_card_due", "fd_maturity", "large_transaction"
    title: str
    message: str
    account_id: Optional[int] = None
    due_date: Optional[datetime] = None
    amount: Optional[Decimal] = None


class DashboardResponse(BaseModel):
    net_worth: NetWorthResponse
    asset_allocation: AssetAllocationResponse
    member_net_worth: List[MemberNetWorth]
    top_movers: List[TopMover]
    alerts: List[Alert]
    last_synced: Optional[datetime] = None


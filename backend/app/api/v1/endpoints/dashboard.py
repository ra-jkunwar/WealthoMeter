"""
Dashboard endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List
from datetime import datetime, timedelta
from decimal import Decimal

from app.core.database import get_db
from app.api.v1.dependencies import get_current_user
from app.schemas.dashboard import (
    DashboardResponse,
    NetWorthResponse,
    AssetAllocationResponse,
    AssetAllocationItem,
    MemberNetWorth,
    TopMover,
    Alert
)
from app.models.user import User
from app.models.account import Account, AccountType, AccountStatus
from app.models.family import FamilyMember
from app.models.transaction import Transaction, TransactionType

router = APIRouter()


@router.get("", response_model=DashboardResponse)
async def get_dashboard(
    family_id: int = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get dashboard data"""
    # Get accessible families
    if family_id:
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
        
        family_ids = [family_id]
    else:
        # Get all families user is member of
        members = db.query(FamilyMember).filter(
            FamilyMember.user_id == current_user.id,
            FamilyMember.is_active == True
        ).all()
        family_ids = [m.family_id for m in members]
    
    if not family_ids:
        # Return empty dashboard
        return DashboardResponse(
            net_worth=NetWorthResponse(
                total_net_worth=Decimal("0"),
                total_assets=Decimal("0"),
                total_liabilities=Decimal("0"),
                last_updated=datetime.utcnow()
            ),
            asset_allocation=AssetAllocationResponse(allocation=[]),
            member_net_worth=[],
            top_movers=[],
            alerts=[],
            last_synced=None
        )
    
    # Get all accounts (include both LINKED and PENDING - manually created accounts are immediately available)
    accounts = db.query(Account).filter(
        Account.family_id.in_(family_ids),
        Account.is_active == True,
        Account.status.in_([AccountStatus.LINKED, AccountStatus.PENDING])
    ).all()
    
    # Calculate net worth
    total_assets = Decimal("0")
    total_liabilities = Decimal("0")
    
    asset_breakdown = {}
    for account in accounts:
        balance = account.current_balance or Decimal("0")
        
        # Categorize as asset or liability
        if account.account_type in [AccountType.CREDIT_CARD, AccountType.DEBT]:
            total_liabilities += abs(balance)
        else:
            total_assets += balance
        
        # Asset allocation
        account_type_str = account.account_type.value
        if account_type_str not in asset_breakdown:
            asset_breakdown[account_type_str] = Decimal("0")
        asset_breakdown[account_type_str] += balance if balance > 0 else Decimal("0")
    
    total_net_worth = total_assets - total_liabilities
    
    # Asset allocation
    total_allocation = sum(asset_breakdown.values()) if asset_breakdown else Decimal("1")
    allocation_items = []
    for account_type, amount in asset_breakdown.items():
        percentage = float((amount / total_allocation * 100)) if total_allocation > 0 else 0.0
        allocation_items.append(AssetAllocationItem(
            account_type=account_type,
            amount=amount,
            percentage=percentage
        ))
    
    # Member net worth
    member_net_worth_list = []
    for family_id in family_ids:
        members = db.query(FamilyMember).filter(
            FamilyMember.family_id == family_id,
            FamilyMember.is_active == True
        ).all()
        
        for member in members:
            user_accounts = db.query(Account).filter(
                Account.family_id == family_id,
                Account.owner_id == member.user_id,
                Account.is_active == True,
                Account.status.in_([AccountStatus.LINKED, AccountStatus.PENDING])
            ).all()
            
            member_total = sum(acc.current_balance or Decimal("0") for acc in user_accounts)
            
            member_net_worth_list.append(MemberNetWorth(
                user_id=member.user_id,
                user_name=member.user.full_name or member.user.email,
                net_worth=member_total,
                accounts_count=len(user_accounts)
            ))
    
    # Top movers (accounts with largest changes in last 7 days)
    top_movers = []
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    
    for account in accounts:
        # Get transactions in last 7 days
        recent_transactions = db.query(Transaction).filter(
            Transaction.account_id == account.id,
            Transaction.transaction_date >= seven_days_ago,
            Transaction.is_active == True
        ).all()
        
        if recent_transactions:
            change_amount = sum(
                t.amount if t.transaction_type == TransactionType.CREDIT else -t.amount
                for t in recent_transactions
            )
            
            if abs(change_amount) > 0:
                current_balance = account.current_balance or Decimal("0")
                change_percentage = float((change_amount / current_balance * 100)) if current_balance > 0 else 0.0
                
                top_movers.append(TopMover(
                    account_id=account.id,
                    account_name=account.name,
                    change_amount=change_amount,
                    change_percentage=change_percentage,
                    change_type="increase" if change_amount > 0 else "decrease"
                ))
    
    # Sort by absolute change
    top_movers.sort(key=lambda x: abs(x.change_amount), reverse=True)
    top_movers = top_movers[:5]
    
    # Alerts
    alerts = []
    
    # Credit card due alerts
    credit_cards = [acc for acc in accounts if acc.account_type == AccountType.CREDIT_CARD]
    for card in credit_cards:
        # TODO: Get due date from metadata
        if card.account_metadata and card.account_metadata.get("due_date"):
            due_date = datetime.fromisoformat(card.account_metadata["due_date"])
            if due_date <= datetime.utcnow() + timedelta(days=7):
                alerts.append(Alert(
                    type="credit_card_due",
                    title=f"Credit Card Payment Due",
                    message=f"{card.name} payment due on {due_date.strftime('%Y-%m-%d')}",
                    account_id=card.id,
                    due_date=due_date,
                    amount=card.current_balance
                ))
    
    # FD maturity alerts
    fds = [acc for acc in accounts if acc.account_type == AccountType.FIXED_DEPOSIT]
    for fd in fds:
        if fd.account_metadata and fd.account_metadata.get("maturity_date"):
            maturity_date = datetime.fromisoformat(fd.account_metadata["maturity_date"])
            if maturity_date <= datetime.utcnow() + timedelta(days=30):
                alerts.append(Alert(
                    type="fd_maturity",
                    title="FD Maturity",
                    message=f"{fd.name} matures on {maturity_date.strftime('%Y-%m-%d')}",
                    account_id=fd.id,
                    due_date=maturity_date,
                    amount=fd.current_balance
                ))
    
    # Large transaction alerts
    large_transactions = db.query(Transaction).join(Account).filter(
        Account.family_id.in_(family_ids),
        Transaction.transaction_date >= datetime.utcnow() - timedelta(days=1),
        Transaction.is_active == True,
        func.abs(Transaction.amount) >= 50000  # Large transaction threshold
    ).all()
    
    for txn in large_transactions:
        alerts.append(Alert(
            type="large_transaction",
            title="Large Transaction",
            message=f"Large {txn.transaction_type.value} of ₹{abs(txn.amount):,.2f}",
            account_id=txn.account_id,
            amount=txn.amount
        ))
    
    # Get last synced time
    last_synced = None
    if accounts:
        synced_times = [acc.last_synced_at for acc in accounts if acc.last_synced_at]
        if synced_times:
            last_synced = max(synced_times)
    
    return DashboardResponse(
        net_worth=NetWorthResponse(
            total_net_worth=total_net_worth,
            total_assets=total_assets,
            total_liabilities=total_liabilities,
            last_updated=datetime.utcnow()
        ),
        asset_allocation=AssetAllocationResponse(allocation=allocation_items),
        member_net_worth=member_net_worth_list,
        top_movers=top_movers,
        alerts=alerts,
        last_synced=last_synced
    )


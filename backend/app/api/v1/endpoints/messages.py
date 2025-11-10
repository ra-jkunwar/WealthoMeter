"""
Message parsing endpoints for automatic transaction creation
"""

from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel

from app.core.database import get_db
from app.api.v1.dependencies import get_current_user
from app.models.user import User
from app.models.transaction import Transaction, TransactionType, TransactionCategory
from app.models.account import Account, AccountType, AccountStatus, AccountProvider
from app.models.family import FamilyMember, FamilyRole
from app.services.message_parser import MessageParser

router = APIRouter()


class MessageRequest(BaseModel):
    message: str
    family_id: Optional[int] = None  # If not provided, use user's first family


@router.post("/parse", status_code=status.HTTP_201_CREATED)
async def parse_message(
    request: MessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Parse a forwarded message (SMS/email) and automatically create transaction
    
    The message will be parsed to extract:
    - Amount
    - Account last 4 digits
    - Transaction type (debit/credit)
    - Date
    - Description
    
    If account with matching last 4 digits exists, transaction is added to it.
    If account doesn't exist, a new account is created in the same family.
    """
    parser = MessageParser()
    parsed_data = parser.parse(request.message)
    
    if not parsed_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not parse transaction details from message. Please ensure the message contains an amount."
        )
    
    # Determine family_id
    family_id = request.family_id
    if not family_id:
        # Get user's first active family
        member = db.query(FamilyMember).filter(
            FamilyMember.user_id == current_user.id,
            FamilyMember.is_active == True
        ).first()
        
        if not member:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No family found. Please create a family first or specify family_id."
            )
        
        family_id = member.family_id
    
    # Check access to family
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
    
    # Find or create account
    account = None
    account_last_4 = parsed_data.get('account_last_4')
    
    if account_last_4:
        # Try to find existing account by last 4 digits
        account = db.query(Account).filter(
            Account.family_id == family_id,
            Account.account_number_last_4 == account_last_4,
            Account.is_active == True
        ).first()
    
    if not account:
        # Create new account
        # Determine account type based on message content
        account_type = AccountType.SAVINGS  # Default
        message_lower = request.message.lower()
        
        if 'card' in message_lower or 'credit' in message_lower:
            account_type = AccountType.CREDIT_CARD
        elif 'debit' in message_lower and 'card' in message_lower:
            account_type = AccountType.SAVINGS  # Debit card usually linked to savings
        
        # Generate account name
        account_name = f"Account {account_last_4}" if account_last_4 else f"Account {datetime.now().strftime('%Y%m%d')}"
        
        # If we can extract bank name from message, use it
        bank_name = _extract_bank_name(request.message)
        if bank_name:
            account_name = f"{bank_name} {account_last_4}" if account_last_4 else f"{bank_name} Account"
        
        account = Account(
            family_id=family_id,
            owner_id=current_user.id,
            name=account_name,
            account_type=account_type,
            provider=AccountProvider.MANUAL,
            account_number_last_4=account_last_4,
            current_balance=Decimal("0.00"),
            currency="INR",
            status=AccountStatus.LINKED
        )
        
        db.add(account)
        db.flush()  # Get account ID
    
    # Create transaction
    transaction_type = parsed_data.get('transaction_type', TransactionType.DEBIT)
    amount = parsed_data.get('amount')
    transaction_date = parsed_data.get('date', datetime.now())
    description = parsed_data.get('description', request.message[:200])
    
    # Generate unique transaction ID
    transaction_id = f"msg_{int(datetime.now().timestamp())}_{account.id}_{hash(request.message) % 1000000}"
    
    # Update account balance
    if transaction_type == TransactionType.CREDIT:
        account.current_balance += amount
    elif transaction_type == TransactionType.DEBIT:
        account.current_balance -= amount
    
    transaction = Transaction(
        account_id=account.id,
        transaction_id=transaction_id,
        transaction_date=transaction_date,
        amount=amount,
        transaction_type=transaction_type,
        category=TransactionCategory.OTHER,
        description=description,
        transaction_metadata=f'{{"source": "message_parser", "original_message": "{request.message[:500]}"}}'
    )
    
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    db.refresh(account)
    
    return {
        "success": True,
        "message": "Transaction created successfully",
        "transaction": {
            "id": transaction.id,
            "amount": float(transaction.amount),
            "type": transaction.transaction_type.value,
            "date": transaction.transaction_date.isoformat(),
            "description": transaction.description
        },
        "account": {
            "id": account.id,
            "name": account.name,
            "last_4": account.account_number_last_4,
            "balance": float(account.current_balance),
            "created": account.id == transaction.account_id  # True if account was just created
        }
    }


def _extract_bank_name(message: str) -> Optional[str]:
    """Extract bank name from message"""
    # Common Indian bank names
    banks = [
        'HDFC', 'ICICI', 'SBI', 'Axis', 'Kotak', 'PNB', 'BOI', 'Canara',
        'Union Bank', 'Indian Bank', 'Bank of Baroda', 'IDBI', 'Yes Bank',
        'RBL', 'Federal Bank', 'South Indian Bank', 'DBS', 'HSBC', 'Citi',
        'Standard Chartered', 'IndusInd', 'DCB', 'Karur Vysya', 'City Union'
    ]
    
    message_upper = message.upper()
    for bank in banks:
        if bank.upper() in message_upper:
            return bank
    
    return None


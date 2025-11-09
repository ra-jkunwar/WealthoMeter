"""
Transaction endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date
import csv
import io

from app.core.database import get_db
from app.api.v1.dependencies import get_current_user
from app.schemas.transaction import TransactionCreate, TransactionUpdate, TransactionResponse
from app.models.user import User
from app.models.transaction import Transaction, TransactionType
from app.models.account import Account
from app.models.family import FamilyMember

router = APIRouter()


@router.get("", response_model=List[TransactionResponse])
async def get_transactions(
    account_id: Optional[int] = None,
    family_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    category: Optional[str] = None,
    limit: int = Query(100, le=1000),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get transactions"""
    query = db.query(Transaction).filter(Transaction.is_active == True)
    
    # Filter by account
    if account_id:
        account = db.query(Account).filter(Account.id == account_id).first()
        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Account not found"
            )
        
        # Check access
        member = db.query(FamilyMember).filter(
            FamilyMember.family_id == account.family_id,
            FamilyMember.user_id == current_user.id,
            FamilyMember.is_active == True
        ).first()
        
        if not member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this account"
            )
        
        query = query.filter(Transaction.account_id == account_id)
    
    # Filter by family
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
        
        # Get account IDs for this family
        account_ids = db.query(Account.id).filter(
            Account.family_id == family_id,
            Account.is_active == True
        ).all()
        account_ids = [a[0] for a in account_ids]
        
        query = query.filter(Transaction.account_id.in_(account_ids))
    
    # Date filters
    if start_date:
        query = query.filter(Transaction.transaction_date >= start_date)
    if end_date:
        query = query.filter(Transaction.transaction_date <= end_date)
    
    # Category filter
    if category:
        query = query.filter(Transaction.category == category)
    
    # Order by date desc
    query = query.order_by(Transaction.transaction_date.desc())
    
    # Pagination
    transactions = query.offset(offset).limit(limit).all()
    
    return transactions


@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get transaction details"""
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    # Check access via account
    account = db.query(Account).filter(Account.id == transaction.account_id).first()
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found"
        )
    
    member = db.query(FamilyMember).filter(
        FamilyMember.family_id == account.family_id,
        FamilyMember.user_id == current_user.id,
        FamilyMember.is_active == True
    ).first()
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this transaction"
        )
    
    return transaction


@router.patch("/{transaction_id}", response_model=TransactionResponse)
async def update_transaction(
    transaction_id: int,
    transaction_update: TransactionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update transaction (mainly for categorization)"""
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    # Check access
    account = db.query(Account).filter(Account.id == transaction.account_id).first()
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found"
        )
    
    member = db.query(FamilyMember).filter(
        FamilyMember.family_id == account.family_id,
        FamilyMember.user_id == current_user.id,
        FamilyMember.is_active == True
    ).first()
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this transaction"
        )
    
    update_data = transaction_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(transaction, field, value)
    
    db.commit()
    db.refresh(transaction)
    
    return transaction


@router.post("", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    transaction_data: TransactionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new transaction"""
    # Check account access
    account = db.query(Account).filter(Account.id == transaction_data.account_id).first()
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found"
        )
    
    member = db.query(FamilyMember).filter(
        FamilyMember.family_id == account.family_id,
        FamilyMember.user_id == current_user.id,
        FamilyMember.is_active == True
    ).first()
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this account"
        )
    
    # Create transaction
    transaction = Transaction(
        account_id=transaction_data.account_id,
        transaction_id=transaction_data.transaction_id,
        transaction_date=transaction_data.transaction_date,
        amount=transaction_data.amount,
        transaction_type=transaction_data.transaction_type,
        category=transaction_data.category,
        description=transaction_data.description,
        transaction_metadata=transaction_data.metadata
    )
    
    db.add(transaction)
    
    # Update account balance if needed
    if transaction_data.transaction_type == TransactionType.CREDIT:
        account.current_balance += transaction_data.amount
    elif transaction_data.transaction_type == TransactionType.DEBIT:
        account.current_balance -= transaction_data.amount
    
    db.commit()
    db.refresh(transaction)
    
    return transaction


@router.post("/import/csv", response_model=List[TransactionResponse], status_code=status.HTTP_201_CREATED)
async def import_transactions_csv(
    file: UploadFile = File(...),
    account_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Import transactions from CSV file"""
    # Read CSV file
    contents = await file.read()
    csv_file = io.StringIO(contents.decode('utf-8'))
    reader = csv.DictReader(csv_file)
    
    created_transactions = []
    errors = []
    
    for row_num, row in enumerate(reader, start=2):  # Start at 2 (1 is header)
        try:
            # Parse CSV row
            account_id_str = row.get('account_id', '').strip()
            if account_id:
                account_id_val = account_id
            else:
                account_id_val = int(account_id_str) if account_id_str else None
            
            if not account_id_val:
                errors.append(f"Row {row_num}: Missing account_id")
                continue
            
            # Check account access
            account = db.query(Account).filter(Account.id == account_id_val).first()
            if not account:
                errors.append(f"Row {row_num}: Account not found")
                continue
            
            member = db.query(FamilyMember).filter(
                FamilyMember.family_id == account.family_id,
                FamilyMember.user_id == current_user.id,
                FamilyMember.is_active == True
            ).first()
            
            if not member:
                errors.append(f"Row {row_num}: You don't have access to this account")
                continue
            
            # Parse transaction data
            date_str = row.get('date', '').strip()
            amount_str = row.get('amount', '0').strip()
            transaction_type_str = row.get('type', 'debit').strip().lower()
            category = row.get('category', 'other').strip()
            description = row.get('description', '').strip()
            transaction_id = row.get('transaction_id', f"csv_{int(datetime.now().timestamp())}_{row_num}").strip()
            
            try:
                transaction_date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            except:
                try:
                    transaction_date = datetime.strptime(date_str, '%Y-%m-%d')
                except:
                    errors.append(f"Row {row_num}: Invalid date format '{date_str}'")
                    continue
            
            try:
                amount = float(amount_str)
            except ValueError:
                errors.append(f"Row {row_num}: Invalid amount '{amount_str}'")
                continue
            
            try:
                transaction_type = TransactionType(transaction_type_str)
            except ValueError:
                errors.append(f"Row {row_num}: Invalid transaction type '{transaction_type_str}'")
                continue
            
            # Create transaction
            transaction = Transaction(
                account_id=account_id_val,
                transaction_id=transaction_id,
                transaction_date=transaction_date,
                amount=amount,
                transaction_type=transaction_type,
                category=category,
                description=description if description else None
            )
            
            db.add(transaction)
            created_transactions.append(transaction)
            
            # Update account balance
            if transaction_type == TransactionType.CREDIT:
                account.current_balance += amount
            elif transaction_type == TransactionType.DEBIT:
                account.current_balance -= amount
            
        except Exception as e:
            errors.append(f"Row {row_num}: {str(e)}")
    
    if errors:
        # Still commit successful transactions, but return errors
        db.commit()
        for transaction in created_transactions:
            db.refresh(transaction)
        raise HTTPException(
            status_code=status.HTTP_207_MULTI_STATUS,
            detail={
                "message": f"Imported {len(created_transactions)} transactions with {len(errors)} errors",
                "errors": errors,
                "transactions": [TransactionResponse.from_orm(t).dict() for t in created_transactions]
            }
        )
    
    db.commit()
    for transaction in created_transactions:
        db.refresh(transaction)
    
    return created_transactions


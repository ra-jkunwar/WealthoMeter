"""
Account management endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import csv
import io

from app.core.database import get_db
from app.api.v1.dependencies import get_current_user
from app.schemas.account import AccountCreate, AccountUpdate, AccountResponse
from app.models.user import User
from app.models.account import Account, AccountStatus, AccountProvider, AccountType
from app.models.family import FamilyMember, FamilyRole

router = APIRouter()


@router.post("", response_model=AccountResponse, status_code=status.HTTP_201_CREATED)
async def create_account(
    account_data: AccountCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new account"""
    # Check if user has access to family
    member = db.query(FamilyMember).filter(
        FamilyMember.family_id == account_data.family_id,
        FamilyMember.user_id == current_user.id,
        FamilyMember.is_active == True
    ).first()
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this family"
        )
    
    # Check if user can edit accounts
    if not member.can_edit_accounts and member.role != FamilyRole.OWNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to create accounts"
        )
    
    account = Account(
        family_id=account_data.family_id,
        owner_id=current_user.id,
        name=account_data.name,
        account_type=account_data.account_type,
        provider=account_data.provider,
        account_number_last_4=account_data.account_number_last_4,
        current_balance=account_data.current_balance,
        currency=account_data.currency,
        account_metadata=account_data.metadata,
        status=AccountStatus.LINKED  # Manually created accounts are immediately linked
    )
    
    db.add(account)
    db.commit()
    db.refresh(account)
    
    return account


@router.get("", response_model=List[AccountResponse])
async def get_accounts(
    family_id: int = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get accounts"""
    query = db.query(Account).filter(Account.is_active == True)
    
    if family_id:
        # Check if user has access to family
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
        
        query = query.filter(Account.family_id == family_id)
    else:
        # Get all families user is member of
        family_ids = db.query(FamilyMember.family_id).filter(
            FamilyMember.user_id == current_user.id,
            FamilyMember.is_active == True
        ).all()
        family_ids = [f[0] for f in family_ids]
        
        query = query.filter(Account.family_id.in_(family_ids))
    
    accounts = query.all()
    return accounts


@router.get("/{account_id}", response_model=AccountResponse)
async def get_account(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get account details"""
    account = db.query(Account).filter(Account.id == account_id).first()
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found"
        )
    
    # Check if user has access
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
    
    return account


@router.patch("/{account_id}", response_model=AccountResponse)
async def update_account(
    account_id: int,
    account_update: AccountUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update account"""
    account = db.query(Account).filter(Account.id == account_id).first()
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found"
        )
    
    # Check if user has access and can edit
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
    
    if not member.can_edit_accounts and member.role != FamilyRole.OWNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to edit accounts"
        )
    
    update_data = account_update.dict(exclude_unset=True)
    # Map metadata to account_metadata
    if 'metadata' in update_data:
        update_data['account_metadata'] = update_data.pop('metadata')
    for field, value in update_data.items():
        setattr(account, field, value)
    
    db.commit()
    db.refresh(account)
    
    return account


@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete account (soft delete)"""
    account = db.query(Account).filter(Account.id == account_id).first()
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found"
        )
    
    # Check if user is owner
    if account.owner_id != current_user.id:
        member = db.query(FamilyMember).filter(
            FamilyMember.family_id == account.family_id,
            FamilyMember.user_id == current_user.id,
            FamilyMember.role == FamilyRole.OWNER,
            FamilyMember.is_active == True
        ).first()
        
        if not member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only account owner or family owner can delete accounts"
            )
    
    account.is_active = False
    db.commit()
    
    return None


@router.post("/{account_id}/sync", response_model=AccountResponse)
async def sync_account(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Sync account data from provider"""
    account = db.query(Account).filter(Account.id == account_id).first()
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found"
        )
    
    # Check if user has access
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
    
    # TODO: Implement actual sync logic based on provider
    # For now, just update last_synced_at
    account.last_synced_at = datetime.utcnow()
    account.status = AccountStatus.LINKED
    db.commit()
    db.refresh(account)
    
    return account


@router.post("/import/csv", response_model=List[AccountResponse], status_code=status.HTTP_201_CREATED)
async def import_accounts_csv(
    file: UploadFile = File(...),
    family_id: int = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Import accounts from CSV file"""
    # Check if user has access to family
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
        
        if not member.can_edit_accounts and member.role != FamilyRole.OWNER:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to create accounts"
            )
    else:
        # Get first family user is member of
        member = db.query(FamilyMember).filter(
            FamilyMember.user_id == current_user.id,
            FamilyMember.is_active == True
        ).first()
        
        if not member:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Please specify a family_id or join a family first"
            )
        
        family_id = member.family_id
    
    # Read CSV file
    contents = await file.read()
    csv_file = io.StringIO(contents.decode('utf-8'))
    reader = csv.DictReader(csv_file)
    
    created_accounts = []
    errors = []
    
    for row_num, row in enumerate(reader, start=2):  # Start at 2 (1 is header)
        try:
            # Parse CSV row
            name = row.get('name', '').strip()
            account_type_str = row.get('account_type', 'savings').strip().lower()
            balance_str = row.get('balance', '0').strip()
            account_number_last_4 = row.get('account_number_last_4', '').strip()
            
            if not name:
                errors.append(f"Row {row_num}: Missing account name")
                continue
            
            # Validate account type
            try:
                account_type = AccountType(account_type_str)
            except ValueError:
                errors.append(f"Row {row_num}: Invalid account type '{account_type_str}'")
                continue
            
            # Parse balance
            try:
                balance = float(balance_str) if balance_str else 0.0
            except ValueError:
                errors.append(f"Row {row_num}: Invalid balance '{balance_str}'")
                continue
            
            # Create account
            account = Account(
                family_id=family_id,
                owner_id=current_user.id,
                name=name,
                account_type=account_type,
                provider=AccountProvider.CSV_IMPORT,
                account_number_last_4=account_number_last_4 if account_number_last_4 else None,
                current_balance=balance,
                currency="INR",
                status=AccountStatus.LINKED
            )
            
            db.add(account)
            created_accounts.append(account)
        except Exception as e:
            errors.append(f"Row {row_num}: {str(e)}")
    
    if errors:
        # Still commit successful accounts, but return errors
        db.commit()
        for account in created_accounts:
            db.refresh(account)
        raise HTTPException(
            status_code=status.HTTP_207_MULTI_STATUS,
            detail={
                "message": f"Imported {len(created_accounts)} accounts with {len(errors)} errors",
                "errors": errors,
                "accounts": [AccountResponse.from_orm(acc).dict() for acc in created_accounts]
            }
        )
    
    db.commit()
    for account in created_accounts:
        db.refresh(account)
    
    return created_accounts


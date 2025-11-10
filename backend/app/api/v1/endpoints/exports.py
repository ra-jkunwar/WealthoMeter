"""
Export and report endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse, FileResponse
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, date
from decimal import Decimal
import io
import csv
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors

from app.core.database import get_db
from app.api.v1.dependencies import get_current_user
from app.models.user import User
from app.models.account import Account, AccountStatus
from app.models.family import FamilyMember
from app.models.transaction import Transaction

router = APIRouter()


@router.get("/net-worth/csv")
async def export_net_worth_csv(
    family_id: int = None,
    start_date: date = None,
    end_date: date = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export net worth data as CSV"""
    # Check access
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
        
        if not member.can_export_reports and member.role.value != "owner":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to export reports"
            )
    
    # Get accounts
    if family_id:
        accounts = db.query(Account).filter(
            Account.family_id == family_id,
            Account.is_active == True
        ).all()
    else:
        # Get all accessible families
        family_ids = db.query(FamilyMember.family_id).filter(
            FamilyMember.user_id == current_user.id,
            FamilyMember.is_active == True
        ).all()
        family_ids = [f[0] for f in family_ids]
        
        accounts = db.query(Account).filter(
            Account.family_id.in_(family_ids),
            Account.is_active == True
        ).all()
    
    # Create CSV
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow(["Account Name", "Account Type", "Balance", "Currency", "Last Synced"])
    
    # Data
    total = Decimal("0")
    for account in accounts:
        balance = account.current_balance or Decimal("0")
        total += balance
        writer.writerow([
            account.name,
            account.account_type.value,
            str(balance),
            account.currency,
            account.last_synced_at.strftime("%Y-%m-%d %H:%M:%S") if account.last_synced_at else "Never"
        ])
    
    # Total row
    writer.writerow(["TOTAL", "", str(total), "INR", ""])
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=net_worth_{datetime.now().strftime('%Y%m%d')}.csv"}
    )


@router.get("/net-worth/pdf")
async def export_net_worth_pdf(
    family_id: int = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export net worth report as PDF"""
    # Check access
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
        
        if not member.can_export_reports and member.role.value != "owner":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to export reports"
            )
    
    # Get accounts
    if family_id:
        accounts = db.query(Account).filter(
            Account.family_id == family_id,
            Account.is_active == True
        ).all()
    else:
        family_ids = db.query(FamilyMember.family_id).filter(
            FamilyMember.user_id == current_user.id,
            FamilyMember.is_active == True
        ).all()
        family_ids = [f[0] for f in family_ids]
        
        accounts = db.query(Account).filter(
            Account.family_id.in_(family_ids),
            Account.is_active == True
        ).all()
    
    # Calculate totals
    total_assets = Decimal("0")
    total_liabilities = Decimal("0")
    
    for account in accounts:
        balance = account.current_balance or Decimal("0")
        # Categorize as asset or liability
        if account.account_type.value in ['credit_card', 'debt']:
            total_liabilities += abs(balance)
        else:
            total_assets += balance if balance > 0 else Decimal("0")
    
    total_net_worth = total_assets - total_liabilities
    
    # Create PDF
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    elements = []
    styles = getSampleStyleSheet()
    
    # Title
    title = Paragraph("Net Worth Report", styles['Title'])
    elements.append(title)
    elements.append(Spacer(1, 12))
    
    # Date
    date_text = Paragraph(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal'])
    elements.append(date_text)
    elements.append(Spacer(1, 20))
    
    # Summary section
    summary_data = [
        ["Total Assets", f"₹{total_assets:,.2f}"],
        ["Total Liabilities", f"₹{total_liabilities:,.2f}"],
        ["Net Worth", f"₹{total_net_worth:,.2f}"]
    ]
    summary_table = Table(summary_data, colWidths=[200, 200])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.lightblue),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('BACKGROUND', (0, -1), (-1, -1), colors.lightgreen),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 20))
    
    # Account details table
    table_data = [["Account Name", "Account Type", "Balance", "Currency"]]
    
    for account in accounts:
        balance = account.current_balance or Decimal("0")
        table_data.append([
            account.name,
            account.account_type.value,
            f"₹{balance:,.2f}",
            account.currency
        ])
    
    # Total row
    table_data.append(["TOTAL", "", f"₹{total_assets + total_liabilities:,.2f}", "INR"])
    
    # Create table
    table = Table(table_data)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -2), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('BACKGROUND', (0, -1), (-1, -1), colors.lightgrey),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
    ]))
    
    elements.append(table)
    
    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    
    return StreamingResponse(
        io.BytesIO(buffer.read()),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=net_worth_{datetime.now().strftime('%Y%m%d')}.pdf"}
    )


@router.get("/transactions/csv")
async def export_transactions_csv(
    account_id: int = None,
    family_id: int = None,
    start_date: date = None,
    end_date: date = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export transactions as CSV"""
    # Check access
    if account_id:
        account = db.query(Account).filter(Account.id == account_id).first()
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")
        
        member = db.query(FamilyMember).filter(
            FamilyMember.family_id == account.family_id,
            FamilyMember.user_id == current_user.id,
            FamilyMember.is_active == True
        ).first()
        
        if not member:
            raise HTTPException(status_code=403, detail="Access denied")
    
    # Get transactions (reuse logic from transactions endpoint)
    query = db.query(Transaction).filter(Transaction.is_active == True)
    
    if account_id:
        query = query.filter(Transaction.account_id == account_id)
    elif family_id:
        account_ids = db.query(Account.id).filter(
            Account.family_id == family_id,
            Account.is_active == True
        ).all()
        account_ids = [a[0] for a in account_ids]
        query = query.filter(Transaction.account_id.in_(account_ids))
    
    if start_date:
        query = query.filter(Transaction.transaction_date >= start_date)
    if end_date:
        query = query.filter(Transaction.transaction_date <= end_date)
    
    transactions = query.order_by(Transaction.transaction_date.desc()).all()
    
    # Create CSV
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow(["Date", "Account", "Type", "Amount", "Category", "Description", "Balance After"])
    
    # Data
    for txn in transactions:
        account = db.query(Account).filter(Account.id == txn.account_id).first()
        writer.writerow([
            txn.transaction_date.strftime("%Y-%m-%d"),
            account.name if account else "Unknown",
            txn.transaction_type.value,
            str(txn.amount),
            txn.category.value,
            txn.description or "",
            str(txn.balance_after) if txn.balance_after else ""
        ])
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=transactions_{datetime.now().strftime('%Y%m%d')}.csv"}
    )


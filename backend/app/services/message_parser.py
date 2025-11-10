"""
Message parser service for extracting transaction details from SMS/email messages
"""

import re
from datetime import datetime
from decimal import Decimal
from typing import Optional, Dict, Tuple
from app.models.transaction import TransactionType, TransactionCategory


class MessageParser:
    """Parse transaction details from SMS/email messages"""
    
    # Common patterns for Indian bank SMS/email formats
    AMOUNT_PATTERNS = [
        r'Rs\.?\s*(\d+(?:,\d+)*(?:\.\d+)?)',  # Rs. 1,234.56
        r'INR\s*(\d+(?:,\d+)*(?:\.\d+)?)',  # INR 1,234.56
        r'₹\s*(\d+(?:,\d+)*(?:\.\d+)?)',  # ₹ 1,234.56
        r'(\d+(?:,\d+)*(?:\.\d+)?)\s*Rs\.?',  # 1,234.56 Rs.
        r'(\d+(?:,\d+)*(?:\.\d+)?)\s*INR',  # 1,234.56 INR
    ]
    
    ACCOUNT_PATTERNS = [
        r'(\d{4})\s*(?:ending|xxxx|XXXX)',  # 1234 ending
        r'ending\s*(\d{4})',  # ending 1234
        r'xxxx\s*(\d{4})',  # xxxx1234
        r'XXXX\s*(\d{4})',  # XXXX1234
        r'(\d{4})\s*(?:xxxx|XXXX)',  # 1234 xxxx
        r'account\s*(\d{4})',  # account 1234
        r'card\s*(\d{4})',  # card 1234
    ]
    
    DATE_PATTERNS = [
        r'(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})',  # DD/MM/YYYY or DD-MM-YYYY
        r'(\d{2,4})[/-](\d{1,2})[/-](\d{1,2})',  # YYYY/MM/DD or YYYY-MM-DD
        r'(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{2,4})',  # DD MMM YYYY
    ]
    
    DEBIT_KEYWORDS = ['debited', 'debit', 'spent', 'paid', 'withdrawn', 'purchase', 'purchased']
    CREDIT_KEYWORDS = ['credited', 'credit', 'received', 'deposited', 'salary', 'refund']
    
    def parse(self, message: str) -> Optional[Dict]:
        """
        Parse message and extract transaction details
        
        Returns:
            Dict with keys: amount, account_last_4, transaction_type, date, description
            or None if parsing fails
        """
        message = message.strip()
        if not message:
            return None
        
        result = {
            'amount': None,
            'account_last_4': None,
            'transaction_type': None,
            'date': None,
            'description': message[:200]  # Use first 200 chars as description
        }
        
        # Extract amount
        amount = self._extract_amount(message)
        if not amount:
            return None  # Must have amount
        result['amount'] = amount
        
        # Extract account last 4 digits
        account_last_4 = self._extract_account_last_4(message)
        result['account_last_4'] = account_last_4
        
        # Determine transaction type
        transaction_type = self._determine_transaction_type(message)
        if not transaction_type:
            # Default to debit if amount found but type unclear
            transaction_type = TransactionType.DEBIT
        result['transaction_type'] = transaction_type
        
        # Extract date
        date = self._extract_date(message)
        result['date'] = date or datetime.now()
        
        # Extract description (merchant/transaction details)
        description = self._extract_description(message)
        if description:
            result['description'] = description
        
        return result
    
    def _extract_amount(self, message: str) -> Optional[Decimal]:
        """Extract amount from message"""
        for pattern in self.AMOUNT_PATTERNS:
            match = re.search(pattern, message, re.IGNORECASE)
            if match:
                amount_str = match.group(1).replace(',', '')
                try:
                    return Decimal(amount_str)
                except:
                    continue
        return None
    
    def _extract_account_last_4(self, message: str) -> Optional[str]:
        """Extract last 4 digits of account/card number"""
        for pattern in self.ACCOUNT_PATTERNS:
            match = re.search(pattern, message, re.IGNORECASE)
            if match:
                digits = match.group(1)
                if len(digits) == 4 and digits.isdigit():
                    return digits
        
        # Try to find any 4-digit number that might be account
        # Look for patterns like "1234" near account/card keywords
        account_context = re.search(
            r'(?:account|card|ac|acc)\s*[:\-]?\s*(\d{4})',
            message,
            re.IGNORECASE
        )
        if account_context:
            return account_context.group(1)
        
        return None
    
    def _determine_transaction_type(self, message: str) -> Optional[TransactionType]:
        """Determine if transaction is debit or credit"""
        message_lower = message.lower()
        
        # Check for debit keywords
        for keyword in self.DEBIT_KEYWORDS:
            if keyword in message_lower:
                return TransactionType.DEBIT
        
        # Check for credit keywords
        for keyword in self.CREDIT_KEYWORDS:
            if keyword in message_lower:
                return TransactionType.CREDIT
        
        return None
    
    def _extract_date(self, message: str) -> Optional[datetime]:
        """Extract date from message"""
        # Try DD/MM/YYYY or DD-MM-YYYY
        match = re.search(r'(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})', message)
        if match:
            day, month, year = match.groups()
            if len(year) == 2:
                year = '20' + year
            try:
                return datetime(int(year), int(month), int(day))
            except:
                pass
        
        # Try YYYY/MM/DD or YYYY-MM-DD
        match = re.search(r'(\d{4})[/-](\d{1,2})[/-](\d{1,2})', message)
        if match:
            year, month, day = match.groups()
            try:
                return datetime(int(year), int(month), int(day))
            except:
                pass
        
        # Try DD MMM YYYY
        month_map = {
            'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
            'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12
        }
        match = re.search(
            r'(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{2,4})',
            message,
            re.IGNORECASE
        )
        if match:
            day, month_name, year = match.groups()
            month = month_map.get(month_name.lower())
            if month:
                if len(year) == 2:
                    year = '20' + year
                try:
                    return datetime(int(year), month, int(day))
                except:
                    pass
        
        return None
    
    def _extract_description(self, message: str) -> Optional[str]:
        """Extract merchant/transaction description"""
        # Try to find merchant name or transaction description
        # Common patterns:
        # - "at MERCHANT NAME"
        # - "to MERCHANT NAME"
        # - "from MERCHANT NAME"
        # - "MERCHANT NAME" (standalone)
        
        # Remove common prefixes
        patterns_to_remove = [
            r'^(?:Your|You|A|An)\s+',
            r'^(?:Transaction|Txn|Payment|Transfer)\s+',
            r'^(?:Rs\.?|INR|₹)\s*\d+.*?\s+',
        ]
        
        cleaned = message
        for pattern in patterns_to_remove:
            cleaned = re.sub(pattern, '', cleaned, flags=re.IGNORECASE)
        
        # Extract text between common markers
        merchant_match = re.search(
            r'(?:at|to|from|via|with)\s+([A-Z][A-Za-z\s&]+?)(?:\s+on|\s+for|\s+dated|$)',
            cleaned,
            re.IGNORECASE
        )
        if merchant_match:
            return merchant_match.group(1).strip()
        
        # If no merchant found, use first meaningful sentence
        sentences = re.split(r'[.!?]\s+', cleaned)
        if sentences:
            first_sentence = sentences[0].strip()
            if len(first_sentence) > 10:  # Meaningful length
                return first_sentence[:100]  # Limit to 100 chars
        
        return None


"""
Security utilities: password hashing, JWT tokens, encryption
"""

from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from cryptography.fernet import Fernet
import boto3
from botocore.exceptions import ClientError
import bcrypt

from app.core.config import settings

# Password hashing
# Use bcrypt directly to avoid passlib's version detection issues
# Configure passlib with minimal settings
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Encryption for sensitive data
_encryption_key: Optional[bytes] = None


def get_encryption_key() -> bytes:
    """Get or generate encryption key"""
    global _encryption_key
    if _encryption_key is None:
        if settings.AWS_KMS_KEY_ID:
            # Use AWS KMS in production
            kms_client = boto3.client('kms', region_name=settings.AWS_REGION)
            # In production, retrieve key from KMS
            # For MVP, use a local key (store securely)
            _encryption_key = Fernet.generate_key()
        else:
            # Development: generate key (store in env in production)
            _encryption_key = Fernet.generate_key()
    return _encryption_key


def encrypt_data(data: str) -> str:
    """Encrypt sensitive data"""
    key = get_encryption_key()
    f = Fernet(key)
    return f.encrypt(data.encode()).decode()


def decrypt_data(encrypted_data: str) -> str:
    """Decrypt sensitive data"""
    key = get_encryption_key()
    f = Fernet(key)
    return f.decrypt(encrypted_data.encode()).decode()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash"""
    # Bcrypt has a 72-byte limit, truncate if necessary (same as hashing)
    password_bytes = plain_password.encode('utf-8')
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
    # Use bcrypt directly to avoid passlib version detection issues
    try:
        # hashed_password is already a string from database
        hash_bytes = hashed_password.encode('utf-8') if isinstance(hashed_password, str) else hashed_password
        return bcrypt.checkpw(password_bytes, hash_bytes)
    except (ValueError, TypeError, AttributeError):
        # Fallback to passlib if bcrypt fails
        truncated_password = password_bytes.decode('utf-8', errors='ignore')
        return pwd_context.verify(truncated_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password"""
    # Bcrypt has a 72-byte limit, truncate if necessary
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
    # Use bcrypt directly to avoid passlib version detection issues
    try:
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password_bytes, salt)
        return hashed.decode('utf-8')
    except Exception:
        # Fallback to passlib if bcrypt fails
        truncated_password = password_bytes.decode('utf-8', errors='ignore')
        return pwd_context.hash(truncated_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict) -> str:
    """Create JWT refresh token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def verify_token(token: str, token_type: str = "access") -> Optional[dict]:
    """Verify and decode JWT token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != token_type:
            return None
        return payload
    except JWTError:
        return None


def create_invitation_token(family_id: int, user_id: int, email: str) -> str:
    """Create an invitation token for family member invitation"""
    to_encode = {
        "family_id": family_id,
        "user_id": user_id,
        "email": email,
        "type": "invitation"
    }
    expire = datetime.utcnow() + timedelta(days=7)  # Invitation expires in 7 days
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def verify_invitation_token(token: str) -> Optional[dict]:
    """Verify and decode invitation token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "invitation":
            return None
        return payload
    except JWTError:
        return None


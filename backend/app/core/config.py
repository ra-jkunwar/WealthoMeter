"""
Application configuration
"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # App
    PROJECT_NAME: str = "WealthoMeter"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]
    
    # Allow CORS_ORIGINS to be set via environment variable (comma-separated)
    # This will be parsed in main.py
    
    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/wealthometer"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # AWS
    AWS_REGION: str = "us-east-1"
    AWS_KMS_KEY_ID: str = ""  # Set in production
    AWS_SECRETS_MANAGER: bool = False
    
    # Account Aggregator
    AA_PROVIDER: str = "camsfinserv"  # camsfinserv, crif, etc.
    AA_CLIENT_ID: str = ""
    AA_CLIENT_SECRET: str = ""
    AA_BASE_URL: str = ""
    
    # Broker APIs
    ZERODHA_API_KEY: str = ""
    ZERODHA_API_SECRET: str = ""
    UPSTOX_API_KEY: str = ""
    UPSTOX_API_SECRET: str = ""
    
    # MF Registrars
    CAMS_API_KEY: str = ""
    KFIN_API_KEY: str = ""
    
    # Email (for invites) - Brevo Configuration
    # All must be set via environment variables: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, FROM_EMAIL
    SMTP_HOST: str = ""  # Set via SMTP_HOST env variable
    SMTP_PORT: int = 587
    SMTP_USER: str = ""  # Set via SMTP_USER env variable
    SMTP_PASSWORD: str = ""  # Set via SMTP_PASSWORD env variable
    FROM_EMAIL: str = ""  # Set via FROM_EMAIL env variable
    
    # Frontend
    FRONTEND_URL: str = "http://localhost:5173"  # Can be overridden via FRONTEND_URL env variable
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()


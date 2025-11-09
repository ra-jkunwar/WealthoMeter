"""
WealthoMeter - Family Wealth Aggregator MVP
Main FastAPI application
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer

from app.core.config import settings
from app.api.v1.api import api_router

app = FastAPI(
    title="WealthoMeter API",
    description="Family Wealth Aggregator MVP",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
# Parse CORS_ORIGINS from environment if set, otherwise use default
cors_origins = settings.CORS_ORIGINS.copy()
if os.getenv("CORS_ORIGINS"):
    # Allow comma-separated list from environment
    cors_origins.extend([origin.strip() for origin in os.getenv("CORS_ORIGINS").split(",")])
# Always add FRONTEND_URL to allowed origins
if settings.FRONTEND_URL:
    cors_origins.append(settings.FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(set(cors_origins)),  # Remove duplicates
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Include API routes
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    return {
        "message": "WealthoMeter API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


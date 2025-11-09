"""
Database connection and session management
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import urllib.parse

from app.core.config import settings

# For Supabase and other cloud databases, we need SSL connections
# Convert direct connection to connection pooler if needed (only for production/cloud)
database_url = settings.DATABASE_URL

# Only use connection pooler in production (Render, etc.) - not for local development
# Check if we're in a cloud environment
import os
# Render sets PORT env var, Heroku sets DYNO, other platforms may set different vars
is_production = (
    os.getenv("RENDER") is not None or 
    os.getenv("DYNO") is not None or 
    os.getenv("PORT") is not None or
    os.getenv("RAILWAY_ENVIRONMENT") is not None or
    os.getenv("VERCEL") is not None
)

# For Supabase, use direct connection with SSL
# The connection pooler hostname format varies and may not be available
# Direct connection works fine if network restrictions allow it
if "supabase.co" in database_url:
    # Keep direct connection (port 5432) but ensure SSL is configured
    pass  # SSL configuration happens below

# Ensure SSL mode is set for Supabase
if "supabase.co" in database_url:
    # Parse URL to add SSL parameters
    parsed = urllib.parse.urlparse(database_url)
    query_params = urllib.parse.parse_qs(parsed.query)
    
    # Add sslmode if not present
    if "sslmode" not in query_params:
        query_params["sslmode"] = ["require"]
    
    # Reconstruct URL with SSL parameters
    new_query = urllib.parse.urlencode(query_params, doseq=True)
    database_url = urllib.parse.urlunparse((
        parsed.scheme,
        parsed.netloc,
        parsed.path,
        parsed.params,
        new_query,
        parsed.fragment
    ))

# Configure connect_args for SSL
connect_args = {}
if "supabase.co" in database_url:
    # For Supabase, ensure SSL is required
    connect_args = {
        "sslmode": "require"
    }

engine = create_engine(
    database_url,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    connect_args=connect_args,
    pool_recycle=3600,  # Recycle connections after 1 hour
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency for database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


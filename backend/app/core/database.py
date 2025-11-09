"""
Database connection and session management
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

# For Supabase and other cloud databases, we need SSL connections
# Check if DATABASE_URL contains SSL parameters, if not add them
database_url = settings.DATABASE_URL

# If connecting to Supabase and SSL params not in URL, add them
if "supabase.co" in database_url and "sslmode" not in database_url:
    # Add SSL mode to connection string
    separator = "&" if "?" in database_url else "?"
    database_url = f"{database_url}{separator}sslmode=require"

# Configure connect_args for SSL if needed
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
    connect_args=connect_args
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


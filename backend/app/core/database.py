"""
Database connection and session management
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import urllib.parse

from app.core.config import settings

# For Supabase and other cloud databases, we need SSL connections
# Convert direct connection to connection pooler if needed
database_url = settings.DATABASE_URL

# If connecting to Supabase, use connection pooler (port 6543) instead of direct (port 5432)
# This is more reliable for external connections and handles IPv4/IPv6 better
if "supabase.co" in database_url and ":5432" in database_url:
    # Replace direct connection port with pooler port
    database_url = database_url.replace(":5432", ":6543")
    # Replace db. with postgres. for pooler connection
    database_url = database_url.replace("@db.", "@postgres.")

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
    pool_size=5,  # Reduced for connection pooler
    max_overflow=10,
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


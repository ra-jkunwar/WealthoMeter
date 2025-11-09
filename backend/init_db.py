"""
Initialize database - create all tables
Run this script to create the database schema
"""

from app.core.database import Base, engine
from app.models import *  # noqa

if __name__ == "__main__":
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")


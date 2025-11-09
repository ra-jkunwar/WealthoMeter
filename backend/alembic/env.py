from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
from app.core.database import Base
from app.models import *  # noqa

target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def get_url():
    """Get database URL with Supabase pooler conversion applied"""
    from app.core.config import settings
    import urllib.parse
    import os
    
    database_url = settings.DATABASE_URL
    
    # For Supabase, always use connection pooler (port 6543) instead of direct (port 5432)
    # The pooler is more reliable for external connections and handles IPv4/IPv6 better
    if "supabase.co" in database_url:
        # Always use pooler for Supabase - replace direct connection with pooler
        if ":5432" in database_url:
            # Replace direct connection port with pooler port
            database_url = database_url.replace(":5432", ":6543")
        # Replace db. with postgres. for pooler connection (if not already postgres.)
        if "@db." in database_url:
            database_url = database_url.replace("@db.", "@postgres.")
        
        # Ensure SSL mode is set
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
    
    return database_url


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    configuration = config.get_section(config.config_ini_section)
    configuration["sqlalchemy.url"] = get_url()
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()


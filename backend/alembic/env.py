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
    """Get database URL with Supabase SSL and IPv4 resolution"""
    from app.core.config import settings
    import urllib.parse
    import socket
    
    database_url = settings.DATABASE_URL
    
    # For Supabase, use direct connection with SSL
    # The connection pooler hostname format varies and may not be available
    # Direct connection works fine if network restrictions allow it
    if "supabase.co" in database_url:
        # Ensure SSL mode is set for direct connection
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
        
        # Force IPv4 by resolving hostname to IPv4 address
        # This helps avoid "Network is unreachable" errors with IPv6
        # Use getaddrinfo with AF_INET to explicitly force IPv4 only
        try:
            hostname = parsed.hostname
            if hostname and not hostname.replace('.', '').replace(':', '').isdigit():
                # Only resolve if it's a hostname, not already an IP
                # Use getaddrinfo with AF_INET to force IPv4 only
                addr_info = socket.getaddrinfo(hostname, None, socket.AF_INET, socket.SOCK_STREAM)
                if addr_info:
                    # Get first IPv4 address
                    ipv4_address = addr_info[0][4][0]
                    # Replace hostname with IP in connection string
                    # Need to replace in netloc (hostname:port) format
                    if parsed.port:
                        new_netloc = f"{ipv4_address}:{parsed.port}"
                    else:
                        new_netloc = ipv4_address
                    database_url = database_url.replace(parsed.netloc, new_netloc)
        except Exception as e:
            # If DNS resolution fails, continue with hostname
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Failed to resolve IPv4 for {hostname if 'hostname' in locals() else 'unknown'}: {e}")
    
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


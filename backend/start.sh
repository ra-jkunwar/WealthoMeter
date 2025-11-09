#!/bin/bash
set -e

# Get PORT from environment variable, default to 8000
PORT=${PORT:-8000}

# Run migrations
alembic upgrade head || true

# Start the server
exec python -m uvicorn app.main:app --host 0.0.0.0 --port "$PORT"


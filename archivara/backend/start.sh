#!/bin/bash
set -e  # Exit on any error

echo "=== Running database migrations ==="
echo "DATABASE_URL: ${DATABASE_URL:0:30}..."

# Run migrations
python -m alembic upgrade head

echo "=== Migrations complete ==="
echo "=== Starting uvicorn on port $PORT ==="

uvicorn app.main:app --host 0.0.0.0 --port $PORT

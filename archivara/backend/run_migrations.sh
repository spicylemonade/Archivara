#!/bin/bash
set -e

echo "=== Running database migrations ==="
echo "DATABASE_URL: ${DATABASE_URL:0:30}..."

python -m alembic upgrade head

echo "=== Migrations complete ==="

#!/bin/bash
set -e

echo "=== Running database migrations ==="
echo "DATABASE_URL: ${DATABASE_URL:0:30}..."

# Try to run migrations, if it fails due to existing tables, stamp and retry
if ! python -m alembic upgrade head 2>&1 | tee /tmp/migration.log; then
    if grep -q "already exists" /tmp/migration.log; then
        echo "=== Tables already exist, stamping with latest migration ==="
        python -m alembic stamp head
        echo "=== Database stamped, running any pending migrations ==="
        python -m alembic upgrade head
    else
        echo "=== Migration failed with unknown error ==="
        exit 1
    fi
fi

echo "=== Migrations complete ==="
echo "Starting uvicorn..."

uvicorn app.main:app --host 0.0.0.0 --port $PORT

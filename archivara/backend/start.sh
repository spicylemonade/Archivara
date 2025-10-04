#!/bin/bash

echo "=== Running database migrations ==="
echo "DATABASE_URL: ${DATABASE_URL:0:30}..."

# Try to run migrations, capture output and exit code
set +e  # Don't exit on error
python -m alembic upgrade head > /tmp/migration.log 2>&1
MIGRATION_EXIT_CODE=$?
set -e  # Re-enable exit on error

# Show output
cat /tmp/migration.log

if [ $MIGRATION_EXIT_CODE -ne 0 ]; then
    if grep -qi "already exists\|duplicate" /tmp/migration.log; then
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

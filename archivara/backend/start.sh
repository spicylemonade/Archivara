#!/bin/bash
set +e  # Don't exit on errors

echo "=== Running database migrations ==="
echo "DATABASE_URL: ${DATABASE_URL:0:30}..."

# ONE-TIME: Reset database to fix schema issues
if [ "${RESET_DB}" = "true" ]; then
    echo "=== RESET_DB flag set, dropping all tables ==="
    python reset_db.py
    if [ $? -ne 0 ]; then
        echo "=== Database reset failed ==="
        exit 1
    fi
    echo "=== Database reset complete ==="
fi

# Try to run migrations, capture output and exit code
python -m alembic upgrade head > /tmp/migration.log 2>&1
MIGRATION_EXIT_CODE=$?

# Show output
cat /tmp/migration.log

if [ $MIGRATION_EXIT_CODE -ne 0 ]; then
    echo "Migration exit code: $MIGRATION_EXIT_CODE"
    if grep -qi "already exists\|duplicate" /tmp/migration.log; then
        echo "=== Tables already exist, stamping with latest migration ==="
        python -m alembic stamp head
        STAMP_EXIT=$?
        echo "Stamp exit code: $STAMP_EXIT"

        echo "=== Database stamped, running any pending migrations ==="
        python -m alembic upgrade head
        UPGRADE_EXIT=$?
        echo "Upgrade exit code: $UPGRADE_EXIT"

        if [ $UPGRADE_EXIT -ne 0 ]; then
            echo "=== Migration still failed after stamping ==="
            exit 1
        fi
    else
        echo "=== Migration failed with unknown error ==="
        exit 1
    fi
fi

set -e  # Re-enable exit on error
echo "=== Migrations complete ==="
echo "Starting uvicorn..."

uvicorn app.main:app --host 0.0.0.0 --port $PORT

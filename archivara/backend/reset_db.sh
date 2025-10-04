#!/bin/bash
# One-time script to reset the database
# Run this manually in Railway: bash reset_db.sh

echo "=== Resetting database ==="
echo "DATABASE_URL: ${DATABASE_URL:0:30}..."

# Convert DATABASE_URL to psql format
PSQL_URL=$(echo $DATABASE_URL | sed 's/postgresql+asyncpg/postgresql/')

echo "Dropping all tables..."
psql "$PSQL_URL" <<EOF
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO PUBLIC;
EOF

echo "=== Database reset complete ==="
echo "Now run: python -m alembic upgrade head"

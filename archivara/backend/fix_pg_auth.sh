#!/bin/bash

echo "Updating PostgreSQL authentication configuration..."

# Find pg_hba.conf location
PG_HBA=$(find /etc/postgresql -name pg_hba.conf 2>/dev/null | head -1)

if [ -z "$PG_HBA" ]; then
    echo "Could not find pg_hba.conf"
    exit 1
fi

echo "Found pg_hba.conf at: $PG_HBA"

# Backup original
sudo cp "$PG_HBA" "${PG_HBA}.backup"

# Update authentication to use md5 for local connections
echo "Updating authentication method to md5..."

sudo tee "$PG_HBA" > /dev/null << CONF
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             postgres                                peer
local   all             all                                     md5
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5
local   replication     all                                     peer
host    replication     all             127.0.0.1/32            md5
host    replication     all             ::1/128                 md5
CONF

# Restart PostgreSQL
echo "Restarting PostgreSQL..."
sudo systemctl restart postgresql

echo "Done! Try running: alembic upgrade head"

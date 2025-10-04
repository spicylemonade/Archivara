#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Setting up Archivara database...${NC}"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}PostgreSQL is not installed. Installing...${NC}"
    sudo apt update
    sudo apt install -y postgresql postgresql-contrib
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
fi

# Create database and user
echo -e "${GREEN}Creating database user and database...${NC}"

sudo -u postgres psql << SQL
-- Drop if exists (for clean setup)
DROP DATABASE IF EXISTS archivara;
DROP USER IF EXISTS archivara;

-- Create user
CREATE USER archivara WITH PASSWORD 'archivara_pass';

-- Create database
CREATE DATABASE archivara OWNER archivara;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE archivara TO archivara;

-- Connect to the database and grant schema privileges
\c archivara
GRANT ALL ON SCHEMA public TO archivara;

SQL

echo -e "${GREEN}Database setup complete!${NC}"
echo -e "${YELLOW}Database: archivara${NC}"
echo -e "${YELLOW}User: archivara${NC}"
echo -e "${YELLOW}Password: archivara_pass${NC}"
echo ""
echo -e "${GREEN}You can now run: alembic upgrade head${NC}"

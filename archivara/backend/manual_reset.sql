-- Manual database reset script
-- Run this in Railway using: railway run psql $DATABASE_URL -f manual_reset.sql

-- Drop all tables
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO PUBLIC;

-- This will force all migrations to run from scratch on next deployment

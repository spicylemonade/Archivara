-- Drop all enum types
DROP TYPE IF EXISTS paperstatus CASCADE;
DROP TYPE IF EXISTS submissionstatus CASCADE;
DROP TYPE IF EXISTS flagtype CASCADE;

-- Drop alembic version table to start fresh
DROP TABLE IF EXISTS alembic_version CASCADE;

-- Drop any remaining tables
DROP TABLE IF EXISTS paper_flags CASCADE;
DROP TABLE IF EXISTS submission_attempts CASCADE;
DROP TABLE IF EXISTS paper_authors CASCADE;
DROP TABLE IF EXISTS papers CASCADE;
DROP TABLE IF EXISTS authors CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create database (only if running this manually, docker-entrypoint creates it automatically)
-- The POSTGRES_DB environment variable in docker-compose.yml creates the database

-- Create schemas for multi-tenant platform
CREATE SCHEMA IF NOT EXISTS tenant_manager;
CREATE SCHEMA IF NOT EXISTS execution_repository;
CREATE SCHEMA IF NOT EXISTS product;

-- Enable row-level security extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Grant permissions
GRANT ALL ON SCHEMA tenant_manager TO wmc_admin;
GRANT ALL ON SCHEMA execution_repository TO wmc_admin;
GRANT ALL ON SCHEMA product TO wmc_admin;

-- Grant all privileges on all tables in schemas to wmc_admin
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA tenant_manager TO wmc_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA execution_repository TO wmc_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA product TO wmc_admin;

-- Grant all privileges on all sequences in schemas to wmc_admin
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA tenant_manager TO wmc_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA execution_repository TO wmc_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA product TO wmc_admin;

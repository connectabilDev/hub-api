-- Database initialization script
-- This script runs when the PostgreSQL container is first created

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS public;

-- Set default search path
SET search_path TO public;

-- Create enum types
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'deleted');
CREATE TYPE product_status AS ENUM ('active', 'inactive', 'out_of_stock');

-- Grant permissions
GRANT ALL PRIVILEGES ON SCHEMA public TO connectabil;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO connectabil;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO connectabil;

-- Create initial indexes for performance
-- These will be created by migrations, but we add them here for initial setup
-- CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
-- CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

-- Log successful initialization
DO $$
BEGIN
  RAISE NOTICE 'Database initialization completed successfully';
END
$$;
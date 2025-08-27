-- Migration: Create organization_schemas table for multi-tenant support
-- This table tracks all organization schemas and their provisioning status

CREATE TABLE IF NOT EXISTS organization_schemas (
    organization_id VARCHAR(255) PRIMARY KEY,
    schema_name VARCHAR(63) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'provisioning',
    created_at TIMESTAMP DEFAULT NOW(),
    provisioned_at TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    
    CONSTRAINT check_status CHECK (status IN ('provisioning', 'active', 'suspended', 'deleted')),
    CONSTRAINT check_schema_name CHECK (schema_name ~ '^[a-z][a-z0-9_]*$')
);

-- Indexes for performance
CREATE INDEX idx_org_status ON organization_schemas(status);
CREATE INDEX idx_org_created ON organization_schemas(created_at DESC);
CREATE INDEX idx_org_provisioned ON organization_schemas(provisioned_at DESC) WHERE provisioned_at IS NOT NULL;
CREATE INDEX idx_org_metadata ON organization_schemas USING GIN (metadata);

-- Comments for documentation
COMMENT ON TABLE organization_schemas IS 'Tracks all organization schemas in the multi-tenant system';
COMMENT ON COLUMN organization_schemas.organization_id IS 'Unique identifier from Logto';
COMMENT ON COLUMN organization_schemas.schema_name IS 'PostgreSQL schema name for this organization';
COMMENT ON COLUMN organization_schemas.status IS 'Current status of the organization schema';
COMMENT ON COLUMN organization_schemas.metadata IS 'Additional organization metadata in JSON format';
-- Workflow Repository Schema for Phase 2

CREATE SCHEMA IF NOT EXISTS workflow_repository;

-- Workflows table (replaces hardcoded definitions from Phase 1)
CREATE TABLE workflow_repository.workflows (
  workflow_id VARCHAR(100) PRIMARY KEY,
  tenant_id VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  bpmn_xml TEXT,
  steps_json JSONB NOT NULL,
  version VARCHAR(20) DEFAULT '1.0',
  status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'ARCHIVED')),
  created_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP,
  approved_by VARCHAR(100)
);

CREATE INDEX idx_workflows_tenant ON workflow_repository.workflows(tenant_id);
CREATE INDEX idx_workflows_status ON workflow_repository.workflows(status);

-- Workflow versions (version control)
CREATE TABLE workflow_repository.workflow_versions (
  version_id SERIAL PRIMARY KEY,
  workflow_id VARCHAR(100) NOT NULL REFERENCES workflow_repository.workflows(workflow_id) ON DELETE CASCADE,
  version VARCHAR(20) NOT NULL,
  bpmn_xml TEXT,
  steps_json JSONB NOT NULL,
  changelog TEXT,
  created_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(workflow_id, version)
);

CREATE INDEX idx_workflow_versions_workflow ON workflow_repository.workflow_versions(workflow_id);

-- Service Catalog (available services for workflows)
CREATE TABLE workflow_repository.service_catalog (
  service_id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('product_api', 'external_api', 'notification', 'custom_service')),
  description TEXT,
  icon VARCHAR(50),
  endpoint_url TEXT,
  authentication_type VARCHAR(50) CHECK (authentication_type IN ('none', 'api_key', 'oauth', 'jwt')),
  parameters_schema JSONB NOT NULL,
  response_schema JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_service_catalog_category ON workflow_repository.service_catalog(category);

-- Tenant-specific custom services
CREATE TABLE workflow_repository.custom_services (
  custom_service_id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(50) NOT NULL,
  service_id VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  endpoint_url TEXT NOT NULL,
  authentication_type VARCHAR(50) DEFAULT 'api_key',
  authentication_config JSONB,
  parameters_schema JSONB NOT NULL,
  response_schema JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_custom_services_tenant ON workflow_repository.custom_services(tenant_id);

-- Workflow configurations (tenant-specific settings)
CREATE TABLE workflow_repository.workflow_configurations (
  config_id SERIAL PRIMARY KEY,
  workflow_id VARCHAR(100) NOT NULL REFERENCES workflow_repository.workflows(workflow_id) ON DELETE CASCADE,
  tenant_id VARCHAR(50) NOT NULL,
  settings_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(workflow_id, tenant_id)
);

-- Update trigger for updated_at
CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON workflow_repository.workflows
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_catalog_updated_at BEFORE UPDATE ON workflow_repository.service_catalog
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_services_updated_at BEFORE UPDATE ON workflow_repository.custom_services
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_configurations_updated_at BEFORE UPDATE ON workflow_repository.workflow_configurations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON SCHEMA workflow_repository TO wmc_admin;
GRANT ALL ON ALL TABLES IN SCHEMA workflow_repository TO wmc_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA workflow_repository TO wmc_admin;

-- Tenant Manager Schema

CREATE TABLE tenant_manager.tenants (
  tenant_id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'INACTIVE')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE tenant_manager.workflow_registry (
  registry_id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(50) NOT NULL REFERENCES tenant_manager.tenants(tenant_id) ON DELETE CASCADE,
  workflow_id VARCHAR(100) NOT NULL,
  workflow_name VARCHAR(255) NOT NULL,
  trigger_type VARCHAR(20) NOT NULL CHECK (trigger_type IN ('sync', 'async')),
  trigger_event VARCHAR(100) NOT NULL,
  extension_point VARCHAR(50),
  status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  registered_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, workflow_id),
  UNIQUE(tenant_id, trigger_event)
);

CREATE INDEX idx_workflow_registry_tenant ON tenant_manager.workflow_registry(tenant_id);
CREATE INDEX idx_workflow_registry_event ON tenant_manager.workflow_registry(trigger_event);

-- Audit trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenant_manager.tenants
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_registry_updated_at BEFORE UPDATE ON tenant_manager.workflow_registry
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

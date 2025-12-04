-- Workflow Execution Repository Schema

-- Workflow Instances Table
CREATE TABLE execution_repository.workflow_instances (
  instance_id VARCHAR(100) PRIMARY KEY,
  workflow_id VARCHAR(100) NOT NULL,
  tenant_id VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'RUNNING',
  trigger_data JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  error_message TEXT
);

-- Workflow State Table
CREATE TABLE execution_repository.workflow_state (
  instance_id VARCHAR(100) PRIMARY KEY REFERENCES execution_repository.workflow_instances(instance_id) ON DELETE CASCADE,
  current_step VARCHAR(100),  -- Changed to VARCHAR to support both numeric and BPMN IDs
  variables JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Step History Table
CREATE TABLE execution_repository.step_history (
  history_id SERIAL PRIMARY KEY,
  instance_id VARCHAR(100) NOT NULL REFERENCES execution_repository.workflow_instances(instance_id) ON DELETE CASCADE,
  step_id VARCHAR(100) NOT NULL,  -- Changed from INTEGER to VARCHAR
  step_name VARCHAR(255) NOT NULL,
  step_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'STARTED',
  input_data JSONB DEFAULT '{}'::jsonb,
  output_data JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  error_message TEXT
);

-- Indexes
CREATE INDEX idx_workflow_instances_tenant ON execution_repository.workflow_instances(tenant_id);
CREATE INDEX idx_workflow_instances_workflow ON execution_repository.workflow_instances(workflow_id);
CREATE INDEX idx_workflow_instances_status ON execution_repository.workflow_instances(status);
CREATE INDEX idx_step_history_instance ON execution_repository.step_history(instance_id);

-- Row Level Security
ALTER TABLE execution_repository.workflow_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_repository.workflow_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_repository.step_history ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY tenant_isolation_workflow_instances ON execution_repository.workflow_instances
  USING (tenant_id = current_setting('app.current_tenant', true));

CREATE POLICY tenant_isolation_workflow_state ON execution_repository.workflow_state
  USING (instance_id IN (SELECT instance_id FROM execution_repository.workflow_instances WHERE tenant_id = current_setting('app.current_tenant', true)));

CREATE POLICY tenant_isolation_step_history ON execution_repository.step_history
  USING (instance_id IN (SELECT instance_id FROM execution_repository.workflow_instances WHERE tenant_id = current_setting('app.current_tenant', true)));

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION execution_repository.update_state_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_workflow_state_timestamp
  BEFORE UPDATE ON execution_repository.workflow_state
  FOR EACH ROW
  EXECUTE FUNCTION execution_repository.update_state_timestamp();

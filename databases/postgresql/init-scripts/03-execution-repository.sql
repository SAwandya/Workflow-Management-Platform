-- Execution Repository Schema

CREATE TABLE execution_repository.workflow_instances (
  instance_id VARCHAR(100) PRIMARY KEY,
  workflow_id VARCHAR(100) NOT NULL,
  tenant_id VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'RUNNING' CHECK (status IN ('RUNNING', 'COMPLETED', 'FAILED', 'WAITING', 'CANCELLED')),
  trigger_data JSONB,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  error_message TEXT
);

CREATE TABLE execution_repository.execution_state (
  instance_id VARCHAR(100) PRIMARY KEY REFERENCES execution_repository.workflow_instances(instance_id) ON DELETE CASCADE,
  current_step VARCHAR(100),
  variables JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE execution_repository.step_history (
  step_id SERIAL PRIMARY KEY,
  instance_id VARCHAR(100) NOT NULL REFERENCES execution_repository.workflow_instances(instance_id) ON DELETE CASCADE,
  step_name VARCHAR(100) NOT NULL,
  step_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('STARTED', 'COMPLETED', 'FAILED', 'SKIPPED')),
  input_data JSONB,
  output_data JSONB,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  error_message TEXT
);

-- Indexes for performance
CREATE INDEX idx_workflow_instances_tenant ON execution_repository.workflow_instances(tenant_id);
CREATE INDEX idx_workflow_instances_status ON execution_repository.workflow_instances(status);
CREATE INDEX idx_workflow_instances_workflow ON execution_repository.workflow_instances(workflow_id);
CREATE INDEX idx_step_history_instance ON execution_repository.step_history(instance_id);

-- Row-level security for tenant isolation
ALTER TABLE execution_repository.workflow_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_repository.execution_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_repository.step_history ENABLE ROW LEVEL SECURITY;

-- Policies (will be activated when setting app.tenant_id)
CREATE POLICY tenant_isolation_instances ON execution_repository.workflow_instances
  USING (tenant_id = current_setting('app.tenant_id', TRUE)::text);

CREATE POLICY tenant_isolation_state ON execution_repository.execution_state
  USING (EXISTS (
    SELECT 1 FROM execution_repository.workflow_instances 
    WHERE instance_id = execution_state.instance_id 
    AND tenant_id = current_setting('app.tenant_id', TRUE)::text
  ));

CREATE POLICY tenant_isolation_history ON execution_repository.step_history
  USING (EXISTS (
    SELECT 1 FROM execution_repository.workflow_instances 
    WHERE instance_id = step_history.instance_id 
    AND tenant_id = current_setting('app.tenant_id', TRUE)::text
  ));

-- Trigger for updating execution_state timestamp
CREATE TRIGGER update_execution_state_updated_at BEFORE UPDATE ON execution_repository.execution_state
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

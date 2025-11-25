const pool = require("../config/database");

class WorkflowRegistryRepository {
  async register(tenantId, workflowData) {
    const {
      workflow_id,
      workflow_name,
      trigger_type,
      trigger_event,
      extension_point,
    } = workflowData;

    const query = `
      INSERT INTO tenant_manager.workflow_registry 
        (tenant_id, workflow_id, workflow_name, trigger_type, trigger_event, extension_point, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE')
      RETURNING *
    `;

    const result = await pool.query(query, [
      tenantId,
      workflow_id,
      workflow_name,
      trigger_type,
      trigger_event,
      extension_point,
    ]);

    return result.rows[0];
  }

  async findByTenantId(tenantId) {
    const query = `
      SELECT * FROM tenant_manager.workflow_registry
      WHERE tenant_id = $1
      ORDER BY registered_at DESC
    `;
    const result = await pool.query(query, [tenantId]);
    return result.rows;
  }

  async findByTenantAndEvent(tenantId, triggerEvent) {
    const query = `
      SELECT * FROM tenant_manager.workflow_registry
      WHERE tenant_id = $1 AND trigger_event = $2 AND status = 'ACTIVE'
    `;
    const result = await pool.query(query, [tenantId, triggerEvent]);
    return result.rows[0];
  }

  async findByTenantAndWorkflow(tenantId, workflowId) {
    const query = `
      SELECT * FROM tenant_manager.workflow_registry
      WHERE tenant_id = $1 AND workflow_id = $2
    `;
    const result = await pool.query(query, [tenantId, workflowId]);
    return result.rows[0];
  }

  async updateStatus(tenantId, workflowId, status) {
    const query = `
      UPDATE tenant_manager.workflow_registry
      SET status = $3, updated_at = NOW()
      WHERE tenant_id = $1 AND workflow_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [tenantId, workflowId, status]);
    return result.rows[0];
  }

  async delete(tenantId, workflowId) {
    const query = `
      DELETE FROM tenant_manager.workflow_registry
      WHERE tenant_id = $1 AND workflow_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [tenantId, workflowId]);
    return result.rows[0];
  }

  async exists(tenantId, workflowId) {
    const query = `
      SELECT EXISTS(
        SELECT 1 FROM tenant_manager.workflow_registry 
        WHERE tenant_id = $1 AND workflow_id = $2
      )
    `;
    const result = await pool.query(query, [tenantId, workflowId]);
    return result.rows[0].exists;
  }
}

module.exports = new WorkflowRegistryRepository();

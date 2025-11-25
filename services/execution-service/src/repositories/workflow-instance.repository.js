const pool = require("../config/database");

class WorkflowInstanceRepository {
  async create(instanceId, workflowId, tenantId, triggerData) {
    const query = `
      INSERT INTO execution_repository.workflow_instances 
        (instance_id, workflow_id, tenant_id, status, trigger_data, started_at)
      VALUES ($1, $2, $3, 'RUNNING', $4, NOW())
      RETURNING *
    `;
    const result = await pool.query(query, [
      instanceId,
      workflowId,
      tenantId,
      triggerData,
    ]);
    return result.rows[0];
  }

  async findById(instanceId, tenantId) {
    const query = `
      SELECT * FROM execution_repository.workflow_instances
      WHERE instance_id = $1 AND tenant_id = $2
    `;
    const result = await pool.query(query, [instanceId, tenantId]);
    return result.rows[0];
  }

  async updateStatus(instanceId, status, errorMessage = null) {
    const query = `
      UPDATE execution_repository.workflow_instances
      SET status = $2::VARCHAR, 
          completed_at = CASE WHEN $2::VARCHAR IN ('COMPLETED', 'FAILED', 'CANCELLED') THEN NOW() ELSE completed_at END,
          error_message = $3
      WHERE instance_id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [instanceId, status, errorMessage]);
    return result.rows[0];
  }

  async findByTenant(tenantId, limit = 50) {
    const query = `
      SELECT * FROM execution_repository.workflow_instances
      WHERE tenant_id = $1
      ORDER BY started_at DESC
      LIMIT $2
    `;
    const result = await pool.query(query, [tenantId, limit]);
    return result.rows;
  }
}

module.exports = new WorkflowInstanceRepository();

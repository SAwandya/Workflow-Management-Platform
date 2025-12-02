const pool = require("../config/database");

class WorkflowRepository {
  async create(workflowData) {
    const {
      workflow_id,
      tenant_id,
      name,
      description,
      bpmn_xml,
      steps_json,
      version,
      created_by,
    } = workflowData;

    const query = `
      INSERT INTO workflow_repository.workflows 
        (workflow_id, tenant_id, name, description, bpmn_xml, steps_json, version, status, created_by, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'DRAFT', $8, NOW())
      RETURNING *
    `;

    const result = await pool.query(query, [
      workflow_id,
      tenant_id,
      name,
      description,
      bpmn_xml,
      JSON.stringify(steps_json),
      version || "1.0",
      created_by,
    ]);

    return result.rows[0];
  }

  async findById(workflowId, tenantId) {
    const query = `
      SELECT * FROM workflow_repository.workflows
      WHERE workflow_id = $1 AND tenant_id = $2
    `;
    const result = await pool.query(query, [workflowId, tenantId]);
    return result.rows[0];
  }

  async findByTenant(tenantId, status = null, limit = 50) {
    let query = `
      SELECT * FROM workflow_repository.workflows
      WHERE tenant_id = $1
    `;
    const params = [tenantId];

    if (status) {
      query += ` AND status = $2`;
      params.push(status);
    }

    query += ` ORDER BY updated_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);
    return result.rows;
  }

  async update(workflowId, tenantId, updates) {
    const { name, description, bpmn_xml, steps_json } = updates;

    const query = `
      UPDATE workflow_repository.workflows
      SET 
        name = COALESCE($3, name),
        description = COALESCE($4, description),
        bpmn_xml = COALESCE($5, bpmn_xml),
        steps_json = COALESCE($6, steps_json),
        updated_at = NOW()
      WHERE workflow_id = $1 AND tenant_id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [
      workflowId,
      tenantId,
      name,
      description,
      bpmn_xml,
      steps_json ? JSON.stringify(steps_json) : null,
    ]);

    return result.rows[0];
  }

  async updateStatus(workflowId, tenantId, status, approvedBy = null) {
    const query = `
      UPDATE workflow_repository.workflows
      SET 
        status = $3,
        approved_by = $4,
        approved_at = CASE WHEN $3 = 'APPROVED' THEN NOW() ELSE approved_at END,
        updated_at = NOW()
      WHERE workflow_id = $1 AND tenant_id = $2
      RETURNING *
    `;

    // Cast null to VARCHAR to avoid type inference issues
    const result = await pool.query(query, [
      workflowId,
      tenantId,
      status,
      approvedBy || null,
    ]);

    return result.rows[0];
  }

  async delete(workflowId, tenantId) {
    const query = `
      DELETE FROM workflow_repository.workflows
      WHERE workflow_id = $1 AND tenant_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [workflowId, tenantId]);
    return result.rows[0];
  }

  async exists(workflowId, tenantId) {
    const query = `
      SELECT EXISTS(
        SELECT 1 FROM workflow_repository.workflows 
        WHERE workflow_id = $1 AND tenant_id = $2
      )
    `;
    const result = await pool.query(query, [workflowId, tenantId]);
    return result.rows[0].exists;
  }
}

module.exports = new WorkflowRepository();

const pool = require("../config/database");

class WorkflowInstanceRepository {
  async create(instanceData) {
    // Debug: Log the data being inserted
    console.log("[WorkflowInstanceRepository] Creating instance with data:");
    console.log(
      "  instance_id:",
      instanceData.instance_id,
      "(length:",
      instanceData.instance_id?.length,
      ")"
    );
    console.log(
      "  workflow_id:",
      instanceData.workflow_id,
      "(length:",
      instanceData.workflow_id?.length,
      ")"
    );
    console.log(
      "  tenant_id:",
      instanceData.tenant_id,
      "(length:",
      instanceData.tenant_id?.length,
      ")"
    );
    console.log("  status:", instanceData.status);
    console.log("  trigger_data type:", typeof instanceData.trigger_data);
    console.log(
      "  trigger_data:",
      JSON.stringify(instanceData.trigger_data).substring(0, 100),
      "..."
    );

    const query = `
      INSERT INTO execution_repository.workflow_instances 
        (instance_id, workflow_id, tenant_id, status, trigger_data, started_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `;

    // Ensure trigger_data is properly formatted as JSON
    const triggerDataJson =
      typeof instanceData.trigger_data === "string"
        ? instanceData.trigger_data
        : JSON.stringify(instanceData.trigger_data || {});

    console.log(
      "[WorkflowInstanceRepository] Formatted trigger_data length:",
      triggerDataJson.length
    );

    try {
      const result = await pool.query(query, [
        instanceData.instance_id,
        instanceData.workflow_id,
        instanceData.tenant_id,
        instanceData.status || "RUNNING",
        triggerDataJson,
      ]);

      console.log(
        "[WorkflowInstanceRepository] ✓ Instance created successfully"
      );
      return result.rows[0];
    } catch (error) {
      console.error(
        "[WorkflowInstanceRepository] Failed to create instance:",
        error.message
      );
      console.error("[WorkflowInstanceRepository] Query parameters:");
      console.error("  $1 (instance_id):", instanceData.instance_id);
      console.error("  $2 (workflow_id):", instanceData.workflow_id);
      console.error("  $3 (tenant_id):", instanceData.tenant_id);
      console.error("  $4 (status):", instanceData.status || "RUNNING");
      console.error("  $5 (trigger_data) length:", triggerDataJson.length);
      throw error;
    }
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

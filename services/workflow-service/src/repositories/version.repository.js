const pool = require("../config/database");

class VersionRepository {
  async create(versionData) {
    const {
      workflow_id,
      version,
      bpmn_xml,
      steps_json,
      changelog,
      created_by,
    } = versionData;

    const query = `
      INSERT INTO workflow_repository.workflow_versions 
        (workflow_id, version, bpmn_xml, steps_json, changelog, created_by, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *
    `;

    const result = await pool.query(query, [
      workflow_id,
      version,
      bpmn_xml,
      JSON.stringify(steps_json),
      changelog,
      created_by,
    ]);

    return result.rows[0];
  }

  async findByWorkflowId(workflowId, limit = 50) {
    const query = `
      SELECT * FROM workflow_repository.workflow_versions
      WHERE workflow_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;
    const result = await pool.query(query, [workflowId, limit]);
    return result.rows;
  }

  async findByVersion(workflowId, version) {
    const query = `
      SELECT * FROM workflow_repository.workflow_versions
      WHERE workflow_id = $1 AND version = $2
    `;
    const result = await pool.query(query, [workflowId, version]);
    return result.rows[0];
  }
}

module.exports = new VersionRepository();

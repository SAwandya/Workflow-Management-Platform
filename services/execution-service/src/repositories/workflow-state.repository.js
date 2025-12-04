const pool = require("../config/database");

class WorkflowStateRepository {
  async create(stateData) {
    const query = `
      INSERT INTO execution_repository.workflow_state 
        (instance_id, current_step, variables, updated_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING *
    `;

    const result = await pool.query(query, [
      stateData.instance_id,
      stateData.current_step,
      JSON.stringify(stateData.variables || {}),
    ]);

    return result.rows[0];
  }

  async findByInstanceId(instanceId) {
    const query = `
      SELECT * FROM execution_repository.workflow_state
      WHERE instance_id = $1
    `;

    const result = await pool.query(query, [instanceId]);
    return result.rows[0];
  }

  async update(instanceId, updates) {
    const { current_step, variables } = updates;

    const query = `
      UPDATE execution_repository.workflow_state
      SET 
        current_step = COALESCE($2, current_step),
        variables = COALESCE($3, variables),
        updated_at = NOW()
      WHERE instance_id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [
      instanceId,
      current_step,
      variables ? JSON.stringify(variables) : null,
    ]);

    return result.rows[0];
  }

  async delete(instanceId) {
    const query = `
      DELETE FROM execution_repository.workflow_state
      WHERE instance_id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [instanceId]);
    return result.rows[0];
  }
}

module.exports = new WorkflowStateRepository();

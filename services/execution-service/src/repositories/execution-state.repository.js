const pool = require("../config/database");

class ExecutionStateRepository {
  async create(instanceId, currentStep, variables = {}) {
    const query = `
      INSERT INTO execution_repository.execution_state 
        (instance_id, current_step, variables, updated_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING *
    `;
    const result = await pool.query(query, [
      instanceId,
      currentStep,
      JSON.stringify(variables),
    ]);
    return result.rows[0];
  }

  async findByInstanceId(instanceId) {
    const query = `
      SELECT * FROM execution_repository.execution_state
      WHERE instance_id = $1
    `;
    const result = await pool.query(query, [instanceId]);
    return result.rows[0];
  }

  async update(instanceId, currentStep, variables) {
    const query = `
      UPDATE execution_repository.execution_state
      SET current_step = $2, variables = $3, updated_at = NOW()
      WHERE instance_id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [
      instanceId,
      currentStep,
      JSON.stringify(variables),
    ]);
    return result.rows[0];
  }

  async updateVariables(instanceId, newVariables) {
    const query = `
      UPDATE execution_repository.execution_state
      SET variables = variables || $2::jsonb, updated_at = NOW()
      WHERE instance_id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [
      instanceId,
      JSON.stringify(newVariables),
    ]);
    return result.rows[0];
  }
}

module.exports = new ExecutionStateRepository();

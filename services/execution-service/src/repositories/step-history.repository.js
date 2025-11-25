const pool = require("../config/database");

class StepHistoryRepository {
  async create(instanceId, stepName, stepType, status, inputData = null) {
    const query = `
      INSERT INTO execution_repository.step_history 
        (instance_id, step_name, step_type, status, input_data, started_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `;
    const result = await pool.query(query, [
      instanceId,
      stepName,
      stepType,
      status,
      inputData ? JSON.stringify(inputData) : null,
    ]);
    return result.rows[0];
  }

  async complete(stepId, status, outputData = null, errorMessage = null) {
    const query = `
      UPDATE execution_repository.step_history
      SET status = $2, 
          output_data = $3, 
          error_message = $4, 
          completed_at = NOW()
      WHERE step_id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [
      stepId,
      status,
      outputData ? JSON.stringify(outputData) : null,
      errorMessage,
    ]);
    return result.rows[0];
  }

  async findByInstanceId(instanceId) {
    const query = `
      SELECT * FROM execution_repository.step_history
      WHERE instance_id = $1
      ORDER BY started_at ASC
    `;
    const result = await pool.query(query, [instanceId]);
    return result.rows;
  }
}

module.exports = new StepHistoryRepository();

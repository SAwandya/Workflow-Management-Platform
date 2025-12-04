const pool = require("../config/database");

class StepHistoryRepository {
  async create(stepData) {
    const query = `
      INSERT INTO execution_repository.step_history 
        (instance_id, step_id, step_name, step_type, status, input_data, started_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *
    `;

    // Ensure step_id is stored as string for consistency
    const stepId = String(stepData.step_id);

    const result = await pool.query(query, [
      stepData.instance_id,
      stepId, // Convert to string
      stepData.step_name,
      stepData.step_type,
      stepData.status || "STARTED",
      JSON.stringify(stepData.input_data || {}),
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

const pool = require("../config/database");

class CustomServiceRepository {
  async create(serviceData) {
    const {
      tenant_id,
      service_id,
      name,
      description,
      endpoint_url,
      authentication_type,
      authentication_config,
      parameters_schema,
      response_schema,
    } = serviceData;

    const query = `
      INSERT INTO workflow_repository.custom_services 
        (tenant_id, service_id, name, description, endpoint_url, authentication_type, 
         authentication_config, parameters_schema, response_schema, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING *
    `;

    const result = await pool.query(query, [
      tenant_id,
      service_id,
      name,
      description,
      endpoint_url,
      authentication_type || "api_key",
      JSON.stringify(authentication_config || {}),
      JSON.stringify(parameters_schema),
      JSON.stringify(response_schema || {}),
    ]);

    return result.rows[0];
  }

  async findByTenant(tenantId) {
    const query = `
      SELECT * FROM workflow_repository.custom_services
      WHERE tenant_id = $1 AND is_active = true
      ORDER BY name
    `;
    const result = await pool.query(query, [tenantId]);
    return result.rows;
  }

  async findById(customServiceId, tenantId) {
    const query = `
      SELECT * FROM workflow_repository.custom_services
      WHERE custom_service_id = $1 AND tenant_id = $2
    `;
    const result = await pool.query(query, [customServiceId, tenantId]);
    return result.rows[0];
  }

  async update(customServiceId, tenantId, updates) {
    const {
      name,
      description,
      endpoint_url,
      parameters_schema,
      response_schema,
    } = updates;

    const query = `
      UPDATE workflow_repository.custom_services
      SET 
        name = COALESCE($3, name),
        description = COALESCE($4, description),
        endpoint_url = COALESCE($5, endpoint_url),
        parameters_schema = COALESCE($6, parameters_schema),
        response_schema = COALESCE($7, response_schema),
        updated_at = NOW()
      WHERE custom_service_id = $1 AND tenant_id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [
      customServiceId,
      tenantId,
      name,
      description,
      endpoint_url,
      parameters_schema ? JSON.stringify(parameters_schema) : null,
      response_schema ? JSON.stringify(response_schema) : null,
    ]);

    return result.rows[0];
  }

  async delete(customServiceId, tenantId) {
    const query = `
      UPDATE workflow_repository.custom_services
      SET is_active = false, updated_at = NOW()
      WHERE custom_service_id = $1 AND tenant_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [customServiceId, tenantId]);
    return result.rows[0];
  }

  async exists(serviceId) {
    const query = `
      SELECT EXISTS(
        SELECT 1 FROM workflow_repository.custom_services 
        WHERE service_id = $1
      )
    `;
    const result = await pool.query(query, [serviceId]);
    return result.rows[0].exists;
  }
}

module.exports = new CustomServiceRepository();

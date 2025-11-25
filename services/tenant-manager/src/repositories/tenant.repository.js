const pool = require("../config/database");

class TenantRepository {
  async create(tenantId, name) {
    const query = `
      INSERT INTO tenant_manager.tenants (tenant_id, name, status)
      VALUES ($1, $2, 'ACTIVE')
      RETURNING *
    `;
    const result = await pool.query(query, [tenantId, name]);
    return result.rows[0];
  }

  async findById(tenantId) {
    const query = `
      SELECT * FROM tenant_manager.tenants
      WHERE tenant_id = $1
    `;
    const result = await pool.query(query, [tenantId]);
    return result.rows[0];
  }

  async findAll() {
    const query = `
      SELECT * FROM tenant_manager.tenants
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  async updateStatus(tenantId, status) {
    const query = `
      UPDATE tenant_manager.tenants
      SET status = $2, updated_at = NOW()
      WHERE tenant_id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [tenantId, status]);
    return result.rows[0];
  }

  async delete(tenantId) {
    const query = `
      DELETE FROM tenant_manager.tenants
      WHERE tenant_id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [tenantId]);
    return result.rows[0];
  }

  async exists(tenantId) {
    const query = `
      SELECT EXISTS(SELECT 1 FROM tenant_manager.tenants WHERE tenant_id = $1)
    `;
    const result = await pool.query(query, [tenantId]);
    return result.rows[0].exists;
  }
}

module.exports = new TenantRepository();

const pool = require("../config/database");

class ServiceCatalogRepository {
  async findAll(category = null, isActive = true) {
    let query = `
      SELECT * FROM workflow_repository.service_catalog
      WHERE is_active = $1
    `;
    const params = [isActive];

    if (category) {
      query += ` AND category = $2`;
      params.push(category);
    }

    query += ` ORDER BY category, name`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  async findById(serviceId) {
    const query = `
      SELECT * FROM workflow_repository.service_catalog
      WHERE service_id = $1
    `;
    const result = await pool.query(query, [serviceId]);
    return result.rows[0];
  }

  async findByCategory(category) {
    const query = `
      SELECT * FROM workflow_repository.service_catalog
      WHERE category = $1 AND is_active = true
      ORDER BY name
    `;
    const result = await pool.query(query, [category]);
    return result.rows;
  }

  async getCategories() {
    const query = `
      SELECT DISTINCT category, COUNT(*) as service_count
      FROM workflow_repository.service_catalog
      WHERE is_active = true
      GROUP BY category
      ORDER BY category
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  async search(searchTerm) {
    const query = `
      SELECT * FROM workflow_repository.service_catalog
      WHERE is_active = true
        AND (
          name ILIKE $1
          OR description ILIKE $1
          OR service_id ILIKE $1
        )
      ORDER BY name
    `;
    const result = await pool.query(query, [`%${searchTerm}%`]);
    return result.rows;
  }
}

module.exports = new ServiceCatalogRepository();

const pool = require("../config/database");

class OrderRepository {
  async create(orderId, tenantId, customerId, orderValue, items) {
    const query = `
      INSERT INTO product.orders 
        (order_id, tenant_id, customer_id, order_value, status, items, created_at)
      VALUES ($1, $2, $3, $4, 'PENDING', $5, NOW())
      RETURNING *
    `;
    const result = await pool.query(query, [
      orderId,
      tenantId,
      customerId,
      orderValue,
      JSON.stringify(items),
    ]);
    return result.rows[0];
  }

  async findById(orderId, tenantId) {
    const query = `
      SELECT * FROM product.orders
      WHERE order_id = $1 AND tenant_id = $2
    `;
    const result = await pool.query(query, [orderId, tenantId]);
    return result.rows[0];
  }

  async findByTenant(tenantId, limit = 50) {
    const query = `
      SELECT * FROM product.orders
      WHERE tenant_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;
    const result = await pool.query(query, [tenantId, limit]);
    return result.rows;
  }

  async updateStatus(orderId, tenantId, status) {
    const query = `
      UPDATE product.orders
      SET status = $3, updated_at = NOW()
      WHERE order_id = $1 AND tenant_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [orderId, tenantId, status]);
    return result.rows[0];
  }

  async delete(orderId, tenantId) {
    const query = `
      DELETE FROM product.orders
      WHERE order_id = $1 AND tenant_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [orderId, tenantId]);
    return result.rows[0];
  }
}

module.exports = new OrderRepository();

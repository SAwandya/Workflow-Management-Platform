const { v4: uuidv4 } = require("uuid");
const orderRepository = require("../repositories/order.repository");
const tenantWorkflowInterceptor = require("../middleware/tenant-workflow-interceptor.middleware");

class OrderController {
  async createOrder(req, res) {
    try {
      const tenantId = req.headers["x-tenant-id"];
      const { customer_id, items, total } = req.body;

      // Validate input
      if (!tenantId || !customer_id || !total) {
        return res.status(400).json({
          error: "Missing required fields: customer_id, total",
          note: "Also ensure X-Tenant-ID header is set",
        });
      }

      // Generate order ID
      const orderId = `ord-${uuidv4()}`;

      // Create order in database
      const order = await orderRepository.create(
        orderId,
        tenantId,
        customer_id,
        total,
        items || []
      );

      console.log(`Order created: ${orderId} for tenant ${tenantId}`);

      // Check if custom workflow exists
      if (req.customWorkflow && req.customWorkflow.enabled) {
        console.log(
          `Triggering custom workflow: ${req.customWorkflow.workflowId}`
        );

        const triggerData = {
          orderId: order.order_id,
          customerId: order.customer_id,
          orderValue: parseFloat(order.order_value),
          items: order.items,
        };

        // Trigger workflow synchronously
        const workflowResult =
          await tenantWorkflowInterceptor.triggerWorkflowSync(
            req.customWorkflow.workflowId,
            tenantId,
            triggerData
          );

        if (workflowResult.success) {
          return res.status(201).json({
            message: "Order created and workflow triggered",
            order: order,
            workflow: {
              triggered: true,
              instanceId: workflowResult.data.instanceId,
              status: workflowResult.data.status,
            },
          });
        } else {
          console.warn("Workflow trigger failed, proceeding with default flow");
          // Fall through to default flow
        }
      }

      // Default flow (no custom workflow or workflow trigger failed)
      console.log(`Using default order processing flow`);

      // Auto-approve orders under threshold
      if (parseFloat(order.order_value) <= 10000) {
        await orderRepository.updateStatus(orderId, tenantId, "CONFIRMED");
        order.status = "CONFIRMED";
      }

      res.status(201).json({
        message: "Order created successfully",
        order: order,
        workflow: {
          triggered: false,
          reason: "No custom workflow configured",
        },
      });
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({
        error: "Failed to create order",
        details: error.message,
      });
    }
  }

  async getOrder(req, res) {
    try {
      const tenantId = req.headers["x-tenant-id"];
      const { orderId } = req.params;

      // Make tenant ID optional for internal service calls
      if (!tenantId) {
        console.warn(
          "No X-Tenant-ID header, attempting query without tenant filter"
        );

        // Try to find order without tenant filter (for internal API calls)
        const query = `
          SELECT * FROM product.orders
          WHERE order_id = $1
        `;
        const pool = require("../config/database");
        const result = await pool.query(query, [orderId]);

        if (result.rows.length === 0) {
          return res.status(404).json({
            error: "Order not found",
            order_id: orderId,
          });
        }

        return res.json({ order: result.rows[0] });
      }

      const order = await orderRepository.findById(orderId, tenantId);

      if (!order) {
        return res.status(404).json({
          error: "Order not found",
          order_id: orderId,
        });
      }

      res.json({ order });
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({
        error: "Failed to fetch order",
        details: error.message,
      });
    }
  }

  async listOrders(req, res) {
    try {
      const tenantId = req.headers["x-tenant-id"];

      if (!tenantId) {
        return res.status(400).json({
          error: "Missing X-Tenant-ID header",
        });
      }

      const limit = parseInt(req.query.limit) || 50;
      const orders = await orderRepository.findByTenant(tenantId, limit);

      res.json({
        tenant_id: tenantId,
        count: orders.length,
        orders,
      });
    } catch (error) {
      console.error("Error listing orders:", error);
      res.status(500).json({
        error: "Failed to list orders",
        details: error.message,
      });
    }
  }

  async confirmOrder(req, res) {
    try {
      const tenantId = req.headers["x-tenant-id"];
      const { orderId } = req.params;

      // Make tenant ID optional for internal service calls
      if (!tenantId) {
        console.warn(
          "No X-Tenant-ID header, attempting update without tenant filter"
        );

        // Update order without tenant filter (for internal API calls)
        const query = `
          UPDATE product.orders
          SET status = 'CONFIRMED', updated_at = NOW()
          WHERE order_id = $1
          RETURNING *
        `;
        const pool = require("../config/database");
        const result = await pool.query(query, [orderId]);

        if (result.rows.length === 0) {
          return res.status(404).json({
            error: "Order not found",
            order_id: orderId,
          });
        }

        return res.json({
          message: "Order confirmed successfully",
          order: result.rows[0],
        });
      }

      const order = await orderRepository.updateStatus(
        orderId,
        tenantId,
        "CONFIRMED"
      );

      if (!order) {
        return res.status(404).json({
          error: "Order not found",
          order_id: orderId,
        });
      }

      res.json({
        message: "Order confirmed successfully",
        order,
      });
    } catch (error) {
      console.error("Error confirming order:", error);
      res.status(500).json({
        error: "Failed to confirm order",
        details: error.message,
      });
    }
  }

  async cancelOrder(req, res) {
    try {
      const tenantId = req.headers["x-tenant-id"];
      const { orderId } = req.params;

      if (!tenantId) {
        return res.status(400).json({
          error: "Missing X-Tenant-ID header",
        });
      }

      const order = await orderRepository.updateStatus(
        orderId,
        tenantId,
        "CANCELLED"
      );

      if (!order) {
        return res.status(404).json({
          error: "Order not found",
          order_id: orderId,
        });
      }

      res.json({
        message: "Order cancelled successfully",
        order,
      });
    } catch (error) {
      console.error("Error cancelling order:", error);
      res.status(500).json({
        error: "Failed to cancel order",
        details: error.message,
      });
    }
  }
}

module.exports = new OrderController();

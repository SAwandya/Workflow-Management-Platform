const express = require("express");
const orderController = require("../controllers/order.controller");
const tenantWorkflowInterceptor = require("../middleware/tenant-workflow-interceptor.middleware");
const workflowInterceptor = require("../middleware/workflow-interceptor.middleware");

const router = express.Router();

// Apply workflow interceptor to order creation
router.post(
  "/",
  tenantWorkflowInterceptor.intercept("ORDER_CREATED"),
  orderController.createOrder.bind(orderController)
);

router.get("/", orderController.listOrders.bind(orderController));
router.get("/:orderId", orderController.getOrder.bind(orderController));
router.patch(
  "/:orderId/confirm",
  orderController.confirmOrder.bind(orderController)
);
router.patch(
  "/:orderId/cancel",
  orderController.cancelOrder.bind(orderController)
);

router.post("/", async (req, res) => {
  try {
    const tenantId = req.headers["x-tenant-id"];

    if (!tenantId) {
      return res.status(400).json({
        error: "Missing X-Tenant-ID header",
      });
    }

    const { customer_id, items, total, notes } = req.body;

    // Validate
    if (!customer_id || !items || !total) {
      return res.status(400).json({
        error: "Missing required fields: customer_id, items, total",
      });
    }

    console.log(
      `Creating order for tenant: ${tenantId}, customer: ${customer_id}`
    );

    // Create order data
    const orderData = {
      tenant_id: tenantId,
      customer_id,
      order_value: total,
      status: "PENDING",
      items: items,
      notes: notes || null,
    };

    // Save order to database
    const order = await orderRepository.create(orderData);
    console.log(`Order created: ${order.order_id}`);

    // Check if custom workflow exists for ORDER_CREATED event
    console.log(`Checking for custom workflow for event: ORDER_CREATED`);
    const customWorkflow = await workflowInterceptor.checkForWorkflow(
      tenantId,
      "ORDER_CREATED"
    );

    let workflowResult = null;

    if (customWorkflow) {
      console.log(`✓ Custom workflow found: ${customWorkflow.workflow_id}`);

      // Trigger workflow with order data
      workflowResult = await workflowInterceptor.triggerWorkflow(
        customWorkflow.workflow_id,
        tenantId,
        {
          orderId: order.order_id,
          customerId: order.customer_id,
          orderValue: parseFloat(order.order_value),
          items: order.items,
        }
      );

      console.log(`Workflow triggered:`, workflowResult);
    } else {
      console.log("No custom workflow found, order created without workflow");
    }

    // Return response
    res.status(201).json({
      message: customWorkflow
        ? "Order created and workflow triggered"
        : "Order created successfully",
      order: {
        order_id: order.order_id,
        customer_id: order.customer_id,
        order_value: order.order_value,
        status: order.status,
        created_at: order.created_at,
      },
      workflow: workflowResult
        ? {
            triggered: true,
            instanceId: workflowResult.instanceId,
            status: workflowResult.status,
          }
        : {
            triggered: false,
          },
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({
      error: "Failed to create order",
      details: error.message,
    });
  }
});

module.exports = router;

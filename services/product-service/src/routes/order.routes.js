const express = require("express");
const orderController = require("../controllers/order.controller");
const tenantWorkflowInterceptor = require("../middleware/tenant-workflow-interceptor.middleware");

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
    // ...existing code...

    // Create order
    const order = await orderRepository.create(orderData);

    // Check for custom workflow
    const customWorkflow = await workflowInterceptor.checkForWorkflow(
      tenantId,
      "ORDER_CREATED"
    );

    let workflowResult = null;
    if (customWorkflow) {
      console.log(`Triggering custom workflow: ${customWorkflow.workflow_id}`);

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
    }

    // Return order and workflow info
    res.status(201).json({
      message: customWorkflow
        ? "Order created and workflow triggered"
        : "Order created successfully",
      order: order,
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
    // ...existing code...
  }
});

module.exports = router;

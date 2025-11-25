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

module.exports = router;

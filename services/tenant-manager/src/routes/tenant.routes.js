const express = require("express");
const tenantController = require("../controllers/tenant.controller");

const router = express.Router();

router.post("/", tenantController.createTenant.bind(tenantController));
router.get("/", tenantController.listTenants.bind(tenantController));
router.get("/:tenantId", tenantController.getTenant.bind(tenantController));
router.patch(
  "/:tenantId/status",
  tenantController.updateTenantStatus.bind(tenantController)
);
router.delete(
  "/:tenantId",
  tenantController.deleteTenant.bind(tenantController)
);

module.exports = router;

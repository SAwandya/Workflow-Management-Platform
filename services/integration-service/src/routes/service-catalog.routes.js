const express = require("express");
const serviceCatalogController = require("../controllers/service-catalog.controller");

const router = express.Router();

// Service Catalog endpoints
router.get(
  "/",
  serviceCatalogController.listServices.bind(serviceCatalogController)
);
router.get(
  "/categories",
  serviceCatalogController.getCategories.bind(serviceCatalogController)
);
router.get(
  "/:serviceId",
  serviceCatalogController.getService.bind(serviceCatalogController)
);
router.get(
  "/:serviceId/schema",
  serviceCatalogController.getServiceSchema.bind(serviceCatalogController)
);

module.exports = router;

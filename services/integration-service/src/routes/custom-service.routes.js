const express = require("express");
const customServiceController = require("../controllers/custom-service.controller");

const router = express.Router();

// Custom Services endpoints
router.post(
  "/",
  customServiceController.createCustomService.bind(customServiceController)
);
router.get(
  "/",
  customServiceController.listCustomServices.bind(customServiceController)
);
router.get(
  "/:customServiceId",
  customServiceController.getCustomService.bind(customServiceController)
);
router.put(
  "/:customServiceId",
  customServiceController.updateCustomService.bind(customServiceController)
);
router.delete(
  "/:customServiceId",
  customServiceController.deleteCustomService.bind(customServiceController)
);

module.exports = router;

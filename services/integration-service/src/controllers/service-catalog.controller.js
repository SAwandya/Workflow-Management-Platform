const serviceCatalogRepository = require("../repositories/service-catalog.repository");

class ServiceCatalogController {
  async listServices(req, res) {
    try {
      const { category, search } = req.query;

      let services;

      if (search) {
        services = await serviceCatalogRepository.search(search);
      } else if (category) {
        services = await serviceCatalogRepository.findByCategory(category);
      } else {
        services = await serviceCatalogRepository.findAll();
      }

      res.json({
        count: services.length,
        services,
      });
    } catch (error) {
      console.error("Error listing services:", error);
      res.status(500).json({
        error: "Failed to list services",
        details: error.message,
      });
    }
  }

  async getService(req, res) {
    try {
      const { serviceId } = req.params;

      const service = await serviceCatalogRepository.findById(serviceId);

      if (!service) {
        return res.status(404).json({
          error: "Service not found",
          service_id: serviceId,
        });
      }

      res.json({ service });
    } catch (error) {
      console.error("Error fetching service:", error);
      res.status(500).json({
        error: "Failed to fetch service",
        details: error.message,
      });
    }
  }

  async getServiceSchema(req, res) {
    try {
      const { serviceId } = req.params;

      const service = await serviceCatalogRepository.findById(serviceId);

      if (!service) {
        return res.status(404).json({
          error: "Service not found",
          service_id: serviceId,
        });
      }

      res.json({
        service_id: service.service_id,
        name: service.name,
        parameters_schema: service.parameters_schema,
        response_schema: service.response_schema,
      });
    } catch (error) {
      console.error("Error fetching service schema:", error);
      res.status(500).json({
        error: "Failed to fetch service schema",
        details: error.message,
      });
    }
  }

  async getCategories(req, res) {
    try {
      const categories = await serviceCatalogRepository.getCategories();

      res.json({
        count: categories.length,
        categories,
      });
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({
        error: "Failed to fetch categories",
        details: error.message,
      });
    }
  }
}

module.exports = new ServiceCatalogController();

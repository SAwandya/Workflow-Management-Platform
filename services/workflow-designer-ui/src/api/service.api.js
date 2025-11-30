import axios from "axios";

const BASE_URL =
  process.env.REACT_APP_INTEGRATION_SERVICE || "http://localhost:3005";
const TENANT_ID = process.env.REACT_APP_TENANT_ID || "tenant-a";

const serviceApi = axios.create({
  baseURL: `${BASE_URL}/api/services`,
  headers: {
    "Content-Type": "application/json",
    "X-Tenant-ID": TENANT_ID,
  },
});

export const serviceCatalogService = {
  // List all services
  listServices: async (category = null, search = null) => {
    const params = {};
    if (category) params.category = category;
    if (search) params.search = search;
    const response = await serviceApi.get("/catalog", { params });
    return response.data;
  },

  // Get service by ID
  getService: async (serviceId) => {
    const response = await serviceApi.get(`/catalog/${serviceId}`);
    return response.data;
  },

  // Get service schema
  getServiceSchema: async (serviceId) => {
    const response = await serviceApi.get(`/catalog/${serviceId}/schema`);
    return response.data;
  },

  // Get categories
  getCategories: async () => {
    const response = await serviceApi.get("/catalog/categories");
    return response.data;
  },

  // Custom services
  listCustomServices: async () => {
    const response = await serviceApi.get("/custom");
    return response.data;
  },

  createCustomService: async (serviceData) => {
    const response = await serviceApi.post("/custom", serviceData);
    return response.data;
  },
};

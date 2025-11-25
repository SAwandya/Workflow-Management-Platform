const axios = require("axios");
const RetryHandler = require("../utils/retry-handler");

class ApiCallerService {
  constructor() {
    this.retryHandler = new RetryHandler(3, 1000);
    this.baseUrls = {
      product: process.env.PRODUCT_SERVICE_URL || "http://product-service:3000",
    };
  }

  async callApi(config) {
    const { method, endpoint, body, headers, timeout = 5000 } = config;

    // Resolve full URL
    const url = this.resolveUrl(endpoint);

    console.log(`Making ${method} request to ${url}`);

    try {
      const response = await this.retryHandler.execute(async () => {
        return await axios({
          method: method.toLowerCase(),
          url,
          data: body,
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
          timeout,
        });
      }, `API call to ${url}`);

      return {
        success: true,
        statusCode: response.status,
        data: response.data,
        headers: response.headers,
      };
    } catch (error) {
      console.error(`API call failed: ${error.message}`);

      return {
        success: false,
        statusCode: error.response?.status || 500,
        error: error.message,
        data: error.response?.data || null,
      };
    }
  }

  resolveUrl(endpoint) {
    // If endpoint starts with http, use as-is
    if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
      return endpoint;
    }

    // If endpoint starts with /api/, assume it's for product service
    if (endpoint.startsWith("/api/")) {
      return `${this.baseUrls.product}${endpoint}`;
    }

    // Otherwise, use product service as default
    return `${this.baseUrls.product}${endpoint}`;
  }

  interpolateVariables(endpoint, variables) {
    let interpolated = endpoint;

    // Replace {variableName} with actual values
    Object.keys(variables).forEach((key) => {
      const placeholder = `{${key}}`;
      if (interpolated.includes(placeholder)) {
        interpolated = interpolated.replace(placeholder, variables[key]);
      }
    });

    return interpolated;
  }
}

module.exports = new ApiCallerService();

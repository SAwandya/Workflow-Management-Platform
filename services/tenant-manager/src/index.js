require("dotenv").config();

// Add startup delay to wait for database
const startupDelay = parseInt(process.env.STARTUP_DELAY || "5000");
console.log(`Waiting ${startupDelay}ms for dependencies to be ready...`);

setTimeout(() => {
  const express = require("express");
  const cors = require("cors");
  const helmet = require("helmet");
  const morgan = require("morgan");
  const tenantRoutes = require("./routes/tenant.routes");
  const workflowRegistryRoutes = require("./routes/workflow-registry.routes");

  const app = express();
  const PORT = process.env.PORT || 3000;

  // Middleware
  app.use(helmet());
  app.use(cors());
  app.use(morgan("combined"));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get("/health", (req, res) => {
    res.json({
      service: "tenant-manager",
      status: "healthy",
      timestamp: new Date().toISOString(),
    });
  });

  // Routes
  app.use("/api/tenants", tenantRoutes);
  app.use("/api/tenants", workflowRegistryRoutes);

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({
      error: "Internal server error",
      message: err.message,
    });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      error: "Not found",
      path: req.path,
    });
  });

  // Start server
  app.listen(PORT, () => {
    console.log(`✓ Tenant Manager service running on port ${PORT}`);
    console.log(`✓ Environment: ${process.env.NODE_ENV || "development"}`);
  });

  // Graceful shutdown
  process.on("SIGTERM", () => {
    console.log("SIGTERM signal received: closing HTTP server");
    server.close(() => {
      console.log("HTTP server closed");
      process.exit(0);
    });
  });
}, startupDelay);

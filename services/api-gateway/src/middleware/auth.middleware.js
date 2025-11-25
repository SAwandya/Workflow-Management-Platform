const jwt = require("jsonwebtoken");

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

class AuthMiddleware {
  // Simple JWT authentication for Phase 1
  // In later phases, this will integrate with full IAM
  authenticate(req, res, next) {
    try {
      // Check for Authorization header
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        // For Phase 1, allow requests without auth (development mode)
        console.warn("No authorization header found, allowing for Phase 1");
        return next();
      }

      // Extract token
      const token = authHeader.startsWith("Bearer ")
        ? authHeader.substring(7)
        : authHeader;

      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);

      // Attach tenant info to request
      req.user = decoded;
      req.tenantId = decoded.tenant_id;

      next();
    } catch (error) {
      console.error("Authentication failed:", error.message);

      // For Phase 1, log error but continue
      console.warn("Auth error in Phase 1, allowing request to continue");
      next();
    }
  }

  // Extract tenant ID from various sources
  extractTenantId(req, res, next) {
    // Priority: 1. JWT token, 2. X-Tenant-ID header, 3. Request body
    let tenantId = req.tenantId; // From JWT

    if (!tenantId) {
      tenantId = req.headers["x-tenant-id"];
    }

    if (!tenantId && req.body) {
      tenantId = req.body.tenant_id;
    }

    if (!tenantId) {
      return res.status(400).json({
        error: "Tenant ID not found",
        message:
          "Please provide tenant ID via header (X-Tenant-ID) or request body",
      });
    }

    req.tenantId = tenantId;
    next();
  }

  // Generate JWT token (for testing)
  static generateToken(tenantId, userId = "test-user") {
    return jwt.sign(
      {
        tenant_id: tenantId,
        user_id: userId,
        role: "admin",
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );
  }
}

module.exports = new AuthMiddleware();

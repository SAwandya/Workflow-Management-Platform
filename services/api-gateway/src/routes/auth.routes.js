const express = require("express");
const AuthMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

// Generate test token (Phase 1 only)
router.post("/token", (req, res) => {
  try {
    const { tenant_id, user_id } = req.body;

    if (!tenant_id) {
      return res.status(400).json({
        error: "Missing required field: tenant_id",
      });
    }

    const token = AuthMiddleware.generateToken(
      tenant_id,
      user_id || "test-user"
    );

    res.json({
      token,
      tenant_id,
      user_id: user_id || "test-user",
      expires_in: "24h",
    });
  } catch (error) {
    res.status(500).json({
      error: "Token generation failed",
      details: error.message,
    });
  }
});

module.exports = router;

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
});

// Test connection with retry logic
const connectWithRetry = async (retries = 5, delay = 2000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await pool.query("SELECT NOW()");
      console.log("✓ Workflow Service database connected successfully");
      return;
    } catch (err) {
      console.error(
        `Database connection attempt ${i + 1}/${retries} failed:`,
        err.message
      );
      if (i < retries - 1) {
        console.log(`Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        console.error("Failed to connect to database after all retries");
      }
    }
  }
};

connectWithRetry();

module.exports = pool;

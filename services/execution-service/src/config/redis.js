const redis = require("redis");

const client = redis.createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

client.on("error", (err) => {
  console.error("Redis client error:", err);
});

client.on("connect", () => {
  console.log("✓ Redis connected successfully");
});

client.connect();

module.exports = client;

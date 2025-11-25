/**
 * Retry handler with exponential backoff
 */
class RetryHandler {
  constructor(maxRetries = 3, initialDelay = 1000) {
    this.maxRetries = maxRetries;
    this.initialDelay = initialDelay;
  }

  async execute(fn, context = "operation") {
    let lastError;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        if (attempt < this.maxRetries) {
          const delay = this.initialDelay * Math.pow(2, attempt);
          console.log(
            `${context} failed (attempt ${attempt + 1}/${
              this.maxRetries + 1
            }), retrying in ${delay}ms...`
          );
          await this.sleep(delay);
        }
      }
    }

    throw lastError;
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = RetryHandler;

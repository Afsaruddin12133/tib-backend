// Lightweight retry helper used for unstable external calls (AI provider).
// `operation` receives the current attempt (1-based) and should throw on failure.
async function retryRequest(operation, options = {}) {
  const retries = Number.isInteger(options.retries) ? options.retries : 1;
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await operation(attempt + 1);
    } catch (error) {
      lastError = error;
      if (attempt === retries) {
        break;
      }
      // Optionally we could add exponential backoff here.
    }
  }

  throw lastError;
}

module.exports = {
  retryRequest,
};

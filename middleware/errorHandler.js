// 404 handler: delegate to the centralized error handler so responses are uniform.
function notFoundHandler(req, res, next) {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

// Centralized error handler - maps known error shapes to appropriate HTTP codes.
// Keep the response body minimal to avoid leaking server internals.
function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || (error.name === "ValidationError" ? 400 : 500);
  let message = error.message || "Server error.";

  // Friendly conversions for common mongoose errors
  if (error.name === "CastError") {
    message = "Invalid resource id.";
  }

  if (error.name === "ValidationError") {
    message = message || "Validation failed.";
  }

  if (error.code === 11000) {
    message = "Duplicate record.";
  }

  // Log server-side errors for investigation (do not expose stack to clients)
  if (statusCode >= 500) {
    console.error(error);
  }

  res.status(statusCode).json({
    error: message,
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};

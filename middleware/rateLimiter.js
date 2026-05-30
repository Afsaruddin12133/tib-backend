const rateLimit = require("express-rate-limit");

const replyRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many reply requests. Please try again later.",
  },
});

module.exports = {
  replyRateLimiter,
};

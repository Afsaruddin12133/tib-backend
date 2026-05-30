const express = require("express");
const {
  startSession,
  replySession,
  endSession,
  getSessionHistory,
} = require("../controllers/sessionController");
const { replyRateLimiter } = require("../middleware/rateLimiter");
const { profanityFilter } = require("../middleware/profanityFilter");

const router = express.Router();

// We intentionally apply profanity filtering only to `/start` so topic creation
// is moderated. Replies are left unfiltered on the server for now (per your
// request)
router.post("/start", profanityFilter, startSession);
router.post("/reply", replyRateLimiter, replySession);
router.post("/end", endSession);
router.get("/history", getSessionHistory);

module.exports = router;

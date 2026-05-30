// Simple profanity filter middleware.
// Note: the list is intentionally small and opinionated. For production use
// consider loading a configurable list or using a third-party package.
const DEFAULT_BAD_WORDS = [
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "cunt",
  "nigger",
  "motherfucker",
  "dick",
  "piss",
  "whore",
  "slut",
  "****",
];

function buildProfanityRegex(words) {
  const escaped = words.map((w) => w.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"));
  return new RegExp(`\\b(?:${escaped.join("|")})\\b`, "i");
}

const profanityRegex = buildProfanityRegex(DEFAULT_BAD_WORDS);

// Blocks requests that contain profane words in `topic` or `userText`.
// Returns a clear message so the frontend can present a helpful UX.
function profanityFilter(req, res, next) {
  const { topic, userText } = req.body || {};
  const textToCheck = [topic, userText].filter(Boolean).join(" ");

  if (!textToCheck) return next();

  if (profanityRegex.test(textToCheck)) {
    return res.status(400).json({
      error: "Inappropriate language detected.",
      message: "This site does not accept abusive or offensive language. Please rephrase and try again.",
    });
  }

  return next();
}

module.exports = {
  profanityFilter,
};

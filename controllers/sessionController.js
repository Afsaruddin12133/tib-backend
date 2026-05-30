const Session = require("../models/Session");
const { generateOpeningQuestion, evaluateExplanation } = require("../services/groqService");
const { calculateStatus } = require("../utils/sessionLogic");

// Controller responsibilities:
// - validate request shape minimally
// - call services that interface with the AI
// - persist session rounds and compute session status

function buildSessionRound(evaluation, userText) {
  // Small helper to keep saved round shape consistent with the AI output.
  return {
    userText,
    score: evaluation.score,
    gaps: evaluation.gaps,
    followUp: evaluation.followUp,
    message: evaluation.message,
  };
}

async function startSession(req, res, next) {
  try {
    const { topic } = req.body;

    // Basic validation: require a non-empty topic string.
    if (!topic || !topic.trim()) {
      return res.status(400).json({ error: "Topic is required." });
    }

    const question = await generateOpeningQuestion(topic.trim());
    // Persist a minimal session record and return the opening question.
    const session = await Session.create({
      topic: topic.trim(),
      rounds: [],
      finalScore: 0,
      status: "active",
    });

    return res.status(201).json({
      sessionId: session._id,
      topic: session.topic,
      status: session.status,
      question: question.followUp,
      message: question.message,
    });
  } catch (error) {
    return next(error);
  }
}

async function replySession(req, res, next) {
  try {
    const { sessionId, userText } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required." });
    }

    // Validate incoming reply text.
    if (!userText || !userText.trim()) {
      return res.status(400).json({ error: "Reply text is required." });
    }

    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({ error: "Session not found." });
    }

    // Prevent replies on ended sessions.
    if (["mastered", "partial", "completed"].includes(session.status)) {
      return res.status(400).json({ error: "This session has already ended." });
    }

    // Ask the AI to evaluate the user's explanation.
    const evaluation = await evaluateExplanation({
      topic: session.topic,
      userText: userText.trim(),
      rounds: session.rounds,
    });

    const round = buildSessionRound(evaluation, userText.trim());
    session.rounds.push(round);

    const sessionStatus = calculateStatus(session.rounds);
    session.finalScore = sessionStatus.finalScore;
    session.status = sessionStatus.status;

    // Persist the updated session state.
    await session.save();

    return res.status(200).json({
      sessionId: session._id,
      topic: session.topic,
      round,
      finalScore: session.finalScore,
      status: session.status,
      sessionComplete: sessionStatus.shouldEnd,
    });
  } catch (error) {
    return next(error);
  }
}

async function endSession(req, res, next) {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required." });
    }

    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({ error: "Session not found." });
    }

    const sessionStatus = calculateStatus(session.rounds);
    session.finalScore = sessionStatus.finalScore;
    session.status = sessionStatus.status === "active" ? "completed" : sessionStatus.status;

    await session.save();

    return res.status(200).json({
      sessionId: session._id,
      topic: session.topic,
      finalScore: session.finalScore,
      status: session.status,
      rounds: session.rounds,
      createdAt: session.createdAt,
    });
  } catch (error) {
    return next(error);
  }
}

async function getSessionHistory(req, res, next) {
  try {
    const sessions = await Session.find().sort({ createdAt: -1 });

    return res.status(200).json({
      sessions,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  startSession,
  replySession,
  endSession,
  getSessionHistory,
};

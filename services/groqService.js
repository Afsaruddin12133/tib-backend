const axios = require("axios");
const { retryRequest } = require("../utils/retryRequest");
const { parseAIResponse } = require("../utils/parseAIResponse");
const {
  buildSessionSystemPrompt,
  buildStartUserPrompt,
  buildEvaluationUserPrompt,
} = require("../prompts/systemPrompt");

// This module centralizes calls to the external AI provider. It performs
// basic validation and transforms the provider response into the small,
// predictable shape the application expects.

const GROQ_API_URL = process.env.GROQ_API_URL || "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env.GROQ_MODEL;
const GROQ_TIMEOUT_MS = Number(process.env.GROQ_TIMEOUT_MS || 10000);

function normalizeEvaluationResponse(parsedResponse) {
  if (!parsedResponse || typeof parsedResponse !== "object") {
    const error = new Error("Malformed AI response.");
    error.statusCode = 502;
    throw error;
  }

  const normalizedScore = Number(parsedResponse.score);
  const normalizedGaps = Array.isArray(parsedResponse.gaps)
    ? parsedResponse.gaps.map((gap) => String(gap))
    : [];
  const normalizedFollowUp = String(parsedResponse.followUp || "").trim();
  const normalizedMessage = String(parsedResponse.message || "").trim();

  if (Number.isNaN(normalizedScore) || normalizedFollowUp.length === 0 || normalizedMessage.length === 0) {
    const error = new Error("Malformed AI response.");
    error.statusCode = 502;
    throw error;
  }

  return {
    score: Math.max(0, Math.min(10, normalizedScore)),
    gaps: normalizedGaps,
    followUp: normalizedFollowUp,
    message: normalizedMessage,
  };
}

async function requestGroqCompletion(messages) {
  if (!process.env.GROQ_API_KEY) {
    const error = new Error("GROQ_API_KEY is missing.");
    error.statusCode = 500;
    throw error;
  }

  if (!GROQ_API_URL || !GROQ_API_URL.startsWith("http")) {
    const error = new Error("GROQ_API_URL is invalid.");
    error.statusCode = 500;
    throw error;
  }

  try {
    const parsedResponse = await retryRequest(async () => {
      const response = await axios.post(
        GROQ_API_URL,
        {
          model: GROQ_MODEL,
          messages,
          temperature: 0.2,
          max_tokens: 700,
          response_format: {
            type: "json_object",
          },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
          timeout: GROQ_TIMEOUT_MS,
        }
      );

      const content = response.data?.choices?.[0]?.message?.content;

      // The provider may return text with fences or extra commentary; parse it
      // into a strict JSON object expected by the rest of the app.
      const parsedContent = parseAIResponse(content);
      return normalizeEvaluationResponse(parsedContent);
    }, { retries: 2 });

    return parsedResponse;
  } catch (error) {
    if (error.statusCode === 500 && error.message === "GROQ_API_KEY is missing.") {
      throw error;
    }

    if (error.statusCode === 500 && error.message === "GROQ_API_URL is invalid.") {
      throw error;
    }

    if (error.response?.status === 401) {
      const authError = new Error("Groq authentication failed. Check GROQ_API_KEY.");
      authError.statusCode = 500;
      throw authError;
    }

    if (error.response?.status === 400) {
      const groqMessage = error.response.data?.error?.message || error.response.data?.message;
      const badRequestError = new Error("Groq request was rejected. Check GROQ_API_URL, GROQ_MODEL, and the prompt payload.");
      badRequestError.statusCode = 500;
      if (groqMessage) {
        badRequestError.details = groqMessage;
      }
      throw badRequestError;
    }

    const friendlyError = new Error("AI is busy. Please try again.");
    friendlyError.statusCode = 503;
    throw friendlyError;
  }
}

async function generateOpeningQuestion(topic) {
  return requestGroqCompletion([
    {
      role: "system",
      content: buildSessionSystemPrompt(topic),
    },
    {
      role: "user",
      content: buildStartUserPrompt(topic),
    },
  ]);
}

async function evaluateExplanation({ topic, userText, rounds }) {
  return requestGroqCompletion([
    {
      role: "system",
      content: buildSessionSystemPrompt(topic),
    },
    {
      role: "user",
      content: buildEvaluationUserPrompt({ topic, userText, rounds }),
    },
  ]);
}

module.exports = {
  generateOpeningQuestion,
  evaluateExplanation,
};

// Parse the AI provider's response into a JSON object. The provider sometimes
// returns fenced codeblocks or extra commentary; this function extracts the
// first JSON object it can find and returns it. If parsing fails we throw a
// `502`-style error so callers can translate this into a friendly client
// message.
function parseAIResponse(content) {
  if (content && typeof content === "object") {
    return content;
  }

  if (typeof content !== "string" || !content.trim()) {
    const error = new Error("Malformed AI response.");
    error.statusCode = 502;
    throw error;
  }

  const cleanedContent = content
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  // Find the first balanced-looking JSON object in the text.
  const firstBraceIndex = cleanedContent.indexOf("{");
  const lastBraceIndex = cleanedContent.lastIndexOf("}");

  if (firstBraceIndex === -1 || lastBraceIndex === -1 || lastBraceIndex <= firstBraceIndex) {
    const error = new Error("Malformed AI response.");
    error.statusCode = 502;
    throw error;
  }

  const jsonText = cleanedContent.slice(firstBraceIndex, lastBraceIndex + 1);

  try {
    return JSON.parse(jsonText);
  } catch (error) {
    const parseError = new Error("Malformed AI response.");
    parseError.statusCode = 502;
    throw parseError;
  }
}

module.exports = {
  parseAIResponse,
};

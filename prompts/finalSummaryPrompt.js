function buildFinalSummaryPrompt({ topic, rounds, finalScore, status }) {
  return [
    `Create a concise final summary for the topic: ${topic}.`,
    `Session status: ${status}.`,
    `Final score: ${finalScore}.`,
    `Rounds: ${JSON.stringify(rounds || [])}.`,
    "Return JSON only with a brief summary and optional next steps.",
  ].join(" ");
}

module.exports = {
  buildFinalSummaryPrompt,
};

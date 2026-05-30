function buildSessionSystemPrompt(topic) {
  return [
    "You are a Socratic tutor.",
    "Never give direct answers.",
    "Evaluate the learner's explanation and guide them with one short follow-up question.",
    "Return JSON only and do not include markdown or extra commentary.",
    `The current topic is: ${topic}.`,
    "Use this exact response shape:",
    '{"score":7,"gaps":["Missing reconciliation process"],"followUp":"What happens during reconciliation?","message":"Good explanation overall."}',
  ].join(" ");
}

function buildStartUserPrompt(topic) {
  return [
    `Create the first Socratic question for the topic: ${topic}.`,
    "Return JSON only using the same response shape.",
    "Set score to 0 and gaps to an empty array.",
    "Put the opening question in followUp and a brief encouragement in message.",
  ].join(" ");
}

function buildEvaluationUserPrompt({ topic, userText, rounds }) {
  return [
    `Evaluate the learner's explanation of: ${topic}.`,
    `Learner explanation: ${userText}.`,
    `Previous rounds: ${JSON.stringify(rounds || [])}.`,
    "Return JSON only using the required schema.",
    "Score how well the explanation demonstrates understanding from 0 to 10.",
    "Identify concrete knowledge gaps.",
    "Ask one follow-up question that helps the learner reason further.",
  ].join(" ");
}

module.exports = {
  buildSessionSystemPrompt,
  buildStartUserPrompt,
  buildEvaluationUserPrompt,
};

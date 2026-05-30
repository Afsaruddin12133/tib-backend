const MASTER_SCORE_THRESHOLD = 8;
const REQUIRED_CONSECUTIVE_ROUNDS = 2;
const HARD_ROUND_LIMIT = 5;

function calculateFinalScore(rounds = []) {
  if (!rounds.length) {
    return 0;
  }

  const total = rounds.reduce((sum, round) => sum + Number(round.score || 0), 0);
  return Math.round((total / rounds.length) * 10) / 10;
}

function checkMastery(rounds = []) {
  if (rounds.length < REQUIRED_CONSECUTIVE_ROUNDS) {
    return false;
  }

  const lastTwoRounds = rounds.slice(-REQUIRED_CONSECUTIVE_ROUNDS);
  return lastTwoRounds.every((round) => Number(round.score || 0) >= MASTER_SCORE_THRESHOLD);
}

function checkRoundLimit(rounds = []) {
  return rounds.length >= HARD_ROUND_LIMIT;
}

function calculateStatus(rounds = []) {
  const finalScore = calculateFinalScore(rounds);

  if (checkMastery(rounds)) {
    return {
      status: "mastered",
      finalScore,
      shouldEnd: true,
    };
  }

  if (checkRoundLimit(rounds)) {
    return {
      status: "partial",
      finalScore,
      shouldEnd: true,
    };
  }

  return {
    status: "active",
    finalScore,
    shouldEnd: false,
  };
}

module.exports = {
  calculateFinalScore,
  checkMastery,
  checkRoundLimit,
  calculateStatus,
};

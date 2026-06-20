const { generateQuestions } = require("./questionGenerator");

const getQuestionKey = (question) => `${question.attribute}:${question.value}`;

const findBestQuestion = (scoredCandidates, questionHistory = []) => {
  if (!scoredCandidates || scoredCandidates.length === 0) {
    return null;
  }

  const askedQuestionKeys = new Set(questionHistory.map(getQuestionKey));

  // Focus question selection on top-scoring candidates (e.g. top 40)
  // to avoid wasting questions on long-tail candidates with low relevance.
  const topScored = scoredCandidates.slice(0, 40);
  const players = topScored.map((c) => c.player);

  const questions = generateQuestions(players);
  let availableQuestions = questions.filter(
    (question) => !askedQuestionKeys.has(getQuestionKey(question))
  );

  // If no questions match the top contenders, fallback to all players in the pool
  if (availableQuestions.length === 0) {
    const allPlayers = scoredCandidates.map((c) => c.player);
    const fallbackQuestions = generateQuestions(allPlayers);
    availableQuestions = fallbackQuestions.filter(
      (question) => !askedQuestionKeys.has(getQuestionKey(question))
    );
    if (availableQuestions.length === 0) {
      return null;
    }
  }

  let bestQuestion = null;
  let smallestSplitDifference = Infinity;

  // Use candidate scores to calculate weighted split
  // Offset scores to make them positive weights for calculations
  const leaderScore = topScored[0].score;
  const weights = topScored.map((c) => Math.max(1, c.score - leaderScore + 50));

  // Track recent attributes in history to penalize repetition (diversity factor)
  const recentAttributes = questionHistory.slice(-3).map((q) => q.attribute);

  availableQuestions.forEach((question) => {
    let yesWeight = 0;
    let noWeight = 0;

    topScored.forEach((c, idx) => {
      const player = c.player;
      const isMatch = player[question.attribute] === question.value;
      const w = weights[idx];

      if (isMatch) {
        yesWeight += w;
      } else {
        noWeight += w;
      }
    });

    let splitDifference = Math.abs(yesWeight - noWeight);

    // Apply repetition penalty if this attribute was asked recently
    if (recentAttributes.includes(question.attribute)) {
      const occurrences = recentAttributes.filter((attr) => attr === question.attribute).length;
      // Add a penalty proportional to how frequently the attribute occurred recently
      splitDifference += occurrences * (yesWeight + noWeight) * 0.25;
    }

    if (splitDifference < smallestSplitDifference) {
      smallestSplitDifference = splitDifference;
      bestQuestion = {
        question: question.question,
        attribute: question.attribute,
        value: question.value,
        yesCount: topScored.filter((c) => c.player[question.attribute] === question.value).length,
        noCount: topScored.filter((c) => c.player[question.attribute] !== question.value).length,
      };
    }
  });

  return bestQuestion;
};

module.exports = {
  findBestQuestion,
};

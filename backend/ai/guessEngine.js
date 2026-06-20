const makeGuess = (candidates) => {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return null;
  }

  const candidateCount = candidates.length;
  const confidence = 100 / candidateCount;

  return {
    guess: candidates[0],
    confidence,
  };
};

module.exports = {
  makeGuess,
};

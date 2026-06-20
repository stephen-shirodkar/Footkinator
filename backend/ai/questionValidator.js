const { evaluatePlayerMatch } = require("./scoringEngine");

const RANGE_ATTRIBUTES = ["age", "goals", "height", "shirtNumber", "assists", "appearances"];

/**
 * Initializes an empty knownFacts tracking object.
 */
const initKnownFacts = () => {
  return {
    nationality: null,
    position: null,
    league: null,
    team: null,
    preferredFoot: null,
    playStyle: null,
    nationalTeam: null,
    age: null,
    height: null,
    shirtNumber: null,
    negative: {
      nationality: [],
      position: [],
      league: [],
      team: [],
      preferredFoot: [],
      playStyle: [],
      nationalTeam: [],
      age: [],
      goals: [],
      height: [],
      shirtNumber: [],
    },
    ranges: {
      age: { min: null, max: null },
      goals: { min: null, max: null },
      height: { min: null, max: null },
      shirtNumber: { min: null, max: null },
    },
  };
};

/**
 * Parses numeric ranges and comparisons (e.g., ">=30", "<25", "10").
 */
const parseRangeValue = (value) => {
  const strVal = String(value).trim();
  const match = strVal.match(/^([>=|<=|>|<]+)?\s*(\d+)$/);
  if (match) {
    return {
      operator: match[1] || "=",
      num: parseInt(match[2], 10),
    };
  }
  return null;
};

/**
 * Updates knownFacts in-place based on the answer to a question.
 */
const updateKnownFacts = (knownFacts, attribute, value, answer) => {
  if (!knownFacts) return;

  // Initialize bounds if missing
  if (RANGE_ATTRIBUTES.includes(attribute) && !knownFacts.ranges[attribute]) {
    knownFacts.ranges[attribute] = { min: null, max: null };
  }

  const parsed = parseRangeValue(value);

  if (answer === true) {
    if (parsed) {
      const { operator, num } = parsed;
      const range = knownFacts.ranges[attribute];
      if (operator === ">=") {
        range.min = range.min !== null ? Math.max(range.min, num) : num;
      } else if (operator === "<=") {
        range.max = range.max !== null ? Math.min(range.max, num) : num;
      } else if (operator === ">") {
        range.min = range.min !== null ? Math.max(range.min, num + 1) : num + 1;
      } else if (operator === "<") {
        range.max = range.max !== null ? Math.min(range.max, num - 1) : num - 1;
      } else if (operator === "=") {
        knownFacts[attribute] = num;
        range.min = num;
        range.max = num;
      }
    } else {
      // Categorical exact match
      knownFacts[attribute] = value;
    }
  } else {
    // answer === false
    if (parsed) {
      const { operator, num } = parsed;
      const range = knownFacts.ranges[attribute];
      if (operator === ">=") {
        // Not >= num means <= num - 1
        range.max = range.max !== null ? Math.min(range.max, num - 1) : num - 1;
      } else if (operator === "<=") {
        // Not <= num means >= num + 1
        range.min = range.min !== null ? Math.max(range.min, num + 1) : num + 1;
      } else if (operator === ">") {
        // Not > num means <= num
        range.max = range.max !== null ? Math.min(range.max, num) : num;
      } else if (operator === "<") {
        // Not < num means >= num
        range.min = range.min !== null ? Math.max(range.min, num) : num;
      } else if (operator === "=") {
        if (!knownFacts.negative[attribute]) {
          knownFacts.negative[attribute] = [];
        }
        if (!knownFacts.negative[attribute].includes(num)) {
          knownFacts.negative[attribute].push(num);
        }
      }
    } else {
      // Categorical negative match
      if (!knownFacts.negative[attribute]) {
        knownFacts.negative[attribute] = [];
      }
      if (!knownFacts.negative[attribute].includes(value)) {
        knownFacts.negative[attribute].push(value);
      }
    }
  }
};

/**
 * Checks if a question's range condition contradicts the known range bounds.
 */
const checkRangeContradiction = (attribute, value, ranges) => {
  const parsed = parseRangeValue(value);
  if (!parsed) return null;

  const { operator, num } = parsed;
  const range = ranges[attribute];
  if (!range) return null;

  if (operator === ">=") {
    if (range.max !== null && range.max < num) {
      return { contradiction: true, reason: `Contradicts range: ${attribute} is known to be <= ${range.max}` };
    }
    if (range.min !== null && range.min >= num) {
      return { redundant: true, reason: `Redundant range: ${attribute} is already known to be >= ${range.min}` };
    }
  } else if (operator === "<=") {
    if (range.min !== null && range.min > num) {
      return { contradiction: true, reason: `Contradicts range: ${attribute} is known to be >= ${range.min}` };
    }
    if (range.max !== null && range.max <= num) {
      return { redundant: true, reason: `Redundant range: ${attribute} is already known to be <= ${range.max}` };
    }
  } else if (operator === ">") {
    if (range.max !== null && range.max <= num) {
      return { contradiction: true, reason: `Contradicts range: ${attribute} is known to be <= ${range.max}` };
    }
    if (range.min !== null && range.min > num) {
      return { redundant: true, reason: `Redundant range: ${attribute} is already known to be >= ${range.min}` };
    }
  } else if (operator === "<") {
    if (range.min !== null && range.min >= num) {
      return { contradiction: true, reason: `Contradicts range: ${attribute} is known to be >= ${range.min}` };
    }
    if (range.max !== null && range.max < num) {
      return { redundant: true, reason: `Redundant range: ${attribute} is already known to be <= ${range.max}` };
    }
  } else if (operator === "=") {
    if (range.min !== null && num < range.min) {
      return { contradiction: true, reason: `Contradicts range: ${attribute} is known to be >= ${range.min}` };
    }
    if (range.max !== null && num > range.max) {
      return { contradiction: true, reason: `Contradicts range: ${attribute} is known to be <= ${range.max}` };
    }
  }

  return null;
};

/**
 * Validates a question against known facts.
 * @returns {Object} { valid: boolean, reason: string | null }
 */
const isQuestionValid = (question, knownFacts, questionHistory, activeCandidates) => {
  if (!question || !question.attribute) {
    return { valid: false, reason: "Invalid question structure" };
  }

  // 1. Check if previously asked
  const isAlreadyAsked = questionHistory.some(
    (q) => q.attribute === question.attribute && String(q.value).toLowerCase() === String(question.value).toLowerCase()
  );
  if (isAlreadyAsked) {
    return { valid: false, reason: "Already asked in this game" };
  }

  // 2. Rule 8: Nationality, Position, League known fact checks
  if (["nationality", "position", "league"].includes(question.attribute)) {
    if (knownFacts[question.attribute] !== undefined && knownFacts[question.attribute] !== null) {
      return { valid: false, reason: `${question.attribute} is already known to be ${knownFacts[question.attribute]}` };
    }
  }

  // 3. Redundancy: If exact attribute is already known (for any single-value category)
  if (!RANGE_ATTRIBUTES.includes(question.attribute)) {
    if (knownFacts[question.attribute] !== undefined && knownFacts[question.attribute] !== null) {
      if (String(knownFacts[question.attribute]).toLowerCase() === String(question.value).toLowerCase()) {
        return { valid: false, reason: `Redundant: ${question.attribute} is already known to be ${knownFacts[question.attribute]}` };
      } else {
        return { valid: false, reason: `Contradicts positive fact: ${question.attribute} is known to be ${knownFacts[question.attribute]}` };
      }
    }
  }

  // 4. Negative fact check
  const negativeList = knownFacts.negative[question.attribute];
  if (negativeList && negativeList.includes(question.value)) {
    return { valid: false, reason: `Contradicts negative fact: ${question.attribute} is known NOT to be ${question.value}` };
  }

  // 5. Range contradiction/redundancy check
  if (RANGE_ATTRIBUTES.includes(question.attribute)) {
    const rangeCheck = checkRangeContradiction(question.attribute, question.value, knownFacts.ranges);
    if (rangeCheck) {
      return { valid: false, reason: rangeCheck.reason };
    }
  }

  // 6. Active candidates count & separation checks (Information Gain = 0)
  if (activeCandidates && activeCandidates.length > 0) {
    let yesCount = 0;
    let noCount = 0;

    activeCandidates.forEach((c) => {
      const player = c.player || c;
      if (evaluatePlayerMatch(player, question.attribute, question.value)) {
        yesCount++;
      } else {
        noCount++;
      }
    });

    if (yesCount === 0 || noCount === 0) {
      return { valid: false, reason: `Provides zero information gain (Split: ${yesCount} YES / ${noCount} NO)` };
    }
  }

  return { valid: true, reason: null };
};

const DIFFICULTY_LEVELS = {
  // Easy
  team: "easy",
  nationality: "easy",
  league: "easy",
  position: "easy",

  // Medium
  nationalTeam: "medium",
  preferredFoot: "medium",
  age: "medium",
  goals: "medium",
  playStyle: "medium",

  // Hard
  shirtNumber: "hard",
  height: "hard",
  assists: "hard",
  appearances: "hard",
  marketValue: "hard",
  roleDescription: "hard"
};

const getDifficulty = (attribute) => {
  return DIFFICULTY_LEVELS[attribute] || "medium";
};

/**
 * Calculates a selection score for a valid question.
 */
const scoreQuestion = (question, knownFacts, questionHistory, activeCandidates, answers = []) => {
  let yesCount = 0;
  let noCount = 0;

  const players = activeCandidates.map((c) => c.player || c);
  players.forEach((player) => {
    if (evaluatePlayerMatch(player, question.attribute, question.value)) {
      yesCount++;
    } else {
      noCount++;
    }
  });

  const total = yesCount + noCount;
  if (total === 0) return 0;

  // 1. Information Gain
  let informationGain = 0;
  if (yesCount > 0 && noCount > 0) {
    const pYes = yesCount / total;
    const pNo = noCount / total;
    informationGain = - (pYes * Math.log2(pYes) + pNo * Math.log2(pNo));
  }

  // 2. Novelty Bonus
  const lastIndex = questionHistory.map(q => q.attribute).lastIndexOf(question.attribute);
  let noveltyBonus = 1.0;
  if (lastIndex === -1) {
    noveltyBonus = 1.5;
  } else {
    const turnsAgo = questionHistory.length - lastIndex;
    noveltyBonus = Math.min(1.3, 1.0 + (turnsAgo * 0.05));
  }

  // 3. Candidate Separation Score
  const ratio = yesCount / total;
  const candidateSeparationScore = 1.0 - Math.abs(ratio - 0.5) * 2;

  // 4. Repetition Penalty
  let repetitionPenalty = 1.0;
  if (lastIndex !== -1) {
    const turnsAgo = questionHistory.length - lastIndex;
    if (turnsAgo === 1) repetitionPenalty = 0.2;
    else if (turnsAgo === 2) repetitionPenalty = 0.5;
    else if (turnsAgo === 3) repetitionPenalty = 0.8;
  }

  // 5. Contradiction Penalty
  let contradictionPenalty = 1.0;
  const validation = isQuestionValid(question, knownFacts, questionHistory, activeCandidates);
  if (!validation.valid) {
    contradictionPenalty = 0.0;
  }

  // 6. Difficulty Adaptation based on UNKNOWN answers frequency
  const unknownCount = answers.filter((a) => a.answer === "unknown").length;
  let difficultyMultiplier = 1.0;
  const difficulty = getDifficulty(question.attribute);

  if (unknownCount >= 2) {
    if (difficulty === "easy") difficultyMultiplier = 1.5;
    else if (difficulty === "medium") difficultyMultiplier = 0.7;
    else if (difficulty === "hard") difficultyMultiplier = 0.2;
  } else if (unknownCount === 1) {
    if (difficulty === "easy") difficultyMultiplier = 1.2;
    else if (difficulty === "medium") difficultyMultiplier = 1.0;
    else if (difficulty === "hard") difficultyMultiplier = 0.6;
  }

  const finalScore = informationGain * noveltyBonus * candidateSeparationScore * repetitionPenalty * contradictionPenalty * difficultyMultiplier;

  return {
    finalScore,
    informationGain,
    noveltyBonus,
    candidateSeparationScore,
    repetitionPenalty,
    contradictionPenalty,
    difficultyMultiplier,
    difficulty,
    yesCount,
    noCount,
  };
};

module.exports = {
  initKnownFacts,
  updateKnownFacts,
  isQuestionValid,
  scoreQuestion,
  getDifficulty,
};

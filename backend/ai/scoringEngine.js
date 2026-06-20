const leagueToNationality = {
  "Premier League": "England",
  "La Liga": "Spain",
  "Bundesliga": "Germany",
  "Serie A": "Italy",
  "Ligue 1": "France",
  "Eredivisie": "Netherlands",
  "Primeira Liga": "Portugal",
  "Championship": "England",
  "MLS": "USA",
  "Saudi Pro League": "Saudi Arabia",
  "Turkish Super Lig": "Turkey",
  "Belgian Pro League": "Belgium"
};

const KNOWN_ATTRIBUTES = [
  "position",
  "nationality",
  "age",
  "league",
  "team",
  "preferredFoot",
  "height",
  "shirtNumber",
  "goals",
  "assists",
  "appearances",
  "nationalTeam",
  "marketValue",
  "playStyle",
  "roleDescription"
];

const evaluatePlayerMatch = (player, attribute, value) => {
  if (!player) return false;
  const playerVal = player[attribute];
  if (playerVal === undefined || playerVal === null) return false;

  if (typeof value === "boolean") {
    return !!playerVal === value;
  }

  const strValue = String(value).trim();
  const playerNum = parseFloat(playerVal);

  if (strValue.startsWith(">=")) {
    const val = parseFloat(strValue.substring(2));
    return !isNaN(playerNum) && !isNaN(val) && playerNum >= val;
  }
  if (strValue.startsWith("<=")) {
    const val = parseFloat(strValue.substring(2));
    return !isNaN(playerNum) && !isNaN(val) && playerNum <= val;
  }
  if (strValue.startsWith(">")) {
    const val = parseFloat(strValue.substring(1));
    return !isNaN(playerNum) && !isNaN(val) && playerNum > val;
  }
  if (strValue.startsWith("<")) {
    const val = parseFloat(strValue.substring(1));
    return !isNaN(playerNum) && !isNaN(val) && playerNum < val;
  }
  if (strValue.includes("-")) {
    const parts = strValue.split("-").map(p => parseFloat(p.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(playerNum)) {
      return playerNum >= parts[0] && playerNum <= parts[1];
    }
  }

  if (typeof playerVal === "string") {
    return playerVal.toLowerCase() === strValue.toLowerCase();
  }

  return playerVal == value;
};

const evaluatePartialMatch = (player, attribute, value, candidates = []) => {
  if (!player) return false;

  if (attribute === "team") {
    let targetLeague = null;
    const searchVal = String(value).toLowerCase();
    for (const c of candidates) {
      const p = c.player || c;
      if (p.team && p.team.toLowerCase() === searchVal) {
        targetLeague = p.league;
        break;
      }
    }
    if (targetLeague && player.league && player.league.toLowerCase() === targetLeague.toLowerCase()) {
      return true;
    }
  }

  if (attribute === "nationality") {
    const nation = String(value).trim().toLowerCase();
    if (player.league) {
      const domesticNation = leagueToNationality[player.league];
      if (domesticNation && domesticNation.toLowerCase() === nation) {
        return true;
      }
    }
  }

  if (attribute === "age") {
    const targetAge = parseFloat(value);
    if (!isNaN(targetAge) && player.age && Math.abs(player.age - targetAge) <= 2) {
      return true;
    }
  }

  if (attribute === "height") {
    const targetHeight = parseFloat(value);
    if (!isNaN(targetHeight) && player.height && Math.abs(player.height - targetHeight) <= 5) {
      return true;
    }
  }

  if (attribute === "shirtNumber") {
    const targetNum = parseFloat(value);
    if (!isNaN(targetNum) && player.shirtNumber && Math.abs(player.shirtNumber - targetNum) <= 2) {
      return true;
    }
  }

  if (["goals", "assists", "appearances"].includes(attribute)) {
    const targetStat = parseFloat(value);
    if (!isNaN(targetStat) && player[attribute] !== undefined && Math.abs(player[attribute] - targetStat) <= 5) {
      return true;
    }
  }

  return false;
};

const calculatePlayerScore = (player, answers, candidates = []) => {
  let score = 0;
  for (const ans of answers) {
    if (ans.answer === "unknown") {
      continue;
    }
    if (!KNOWN_ATTRIBUTES.includes(ans.attribute) && ans.expectedAnswers && typeof ans.expectedAnswers === "object") {
      const expected = ans.expectedAnswers[player.apiPlayerId];
      if (expected !== undefined && expected !== null) {
        score += expected === ans.answer ? 10 : -10;
      } else {
        score += ans.answer === false ? 10 : -10;
      }
      continue;
    }

    const isMatch = evaluatePlayerMatch(player, ans.attribute, ans.value);
    if (ans.answer === true) {
      if (isMatch) {
        score += 10;
      } else if (evaluatePartialMatch(player, ans.attribute, ans.value, candidates)) {
        score += 5;
      } else {
        score += -10;
      }
    } else {
      score += !isMatch ? 10 : -10;
    }
  }
  return score;
};

const getScoredCandidates = (session) => {
  if (!session || !session.candidates) return [];
  
  return session.candidates
    .map((player) => {
      const score = calculatePlayerScore(player, session.answers, session.candidates);
      return { player, score };
    })
    .sort((a, b) => b.score - a.score);
};

const calculateConfidence = (scoredCandidates, answers = []) => {
  if (!scoredCandidates || scoredCandidates.length === 0) return 0;
  if (scoredCandidates.length === 1) return 100;

  const leaderScore = scoredCandidates[0].score;
  const runnerUpScore = scoredCandidates[1].score;

  if (leaderScore <= 0) return 5;

  const gap = leaderScore - runnerUpScore;
  if (gap <= 0) return 10;

  const gapFactor = Math.min(1, gap / 30);
  const scoreFactor = Math.min(1, leaderScore / 50);

  const unknownCount = answers.filter((a) => a.answer === "unknown").length;
  const decayFactor = Math.pow(0.93, unknownCount);

  const confidence = Math.round((0.75 * gapFactor + 0.25 * scoreFactor) * 100 * decayFactor);

  return Math.min(100, Math.max(5, confidence));
};

const shouldGuess = (scoredCandidates, questionHistoryLength) => {
  if (!scoredCandidates || scoredCandidates.length === 0) return false;
  if (scoredCandidates.length === 1) return true;

  const leaderScore = scoredCandidates[0].score;
  const runnerUpScore = scoredCandidates[1].score;

  const stronglyOutperforms = (leaderScore - runnerUpScore >= 45) && (leaderScore >= 30);
  const confidence = calculateConfidence(scoredCandidates);
  const highConfidence = confidence >= 90;

  // Set maximum limits: if 20 questions asked, make a guess if leader is positive
  const maxQuestionsReached = questionHistoryLength >= 20 && leaderScore > 0 && (leaderScore - runnerUpScore >= 10);

  // If there's only 1 active player with score > 0, guess
  const positiveScores = scoredCandidates.filter(c => c.score > 0);
  const singlePositiveLeft = positiveScores.length === 1 && leaderScore >= 20;

  return stronglyOutperforms || highConfidence || maxQuestionsReached || singlePositiveLeft;
};

module.exports = {
  calculatePlayerScore,
  getScoredCandidates,
  calculateConfidence,
  shouldGuess,
  evaluatePlayerMatch,
  evaluatePartialMatch,
};

const { generateCustomQuestion } = require("../services/openaiService");
const { evaluatePlayerMatch } = require("./scoringEngine");

const getCandidateQuestions = (players) => {
  const list = [];
  const seen = new Set();

  const add = (attribute, value, questionText) => {
    const key = `${attribute}:${value}`;
    if (!seen.has(key)) {
      seen.add(key);
      list.push({ attribute, value, question: questionText });
    }
  };

  players.forEach(p => {
    // Original attributes
    if (p.position) {
      add("position", p.position, `Is your player a ${p.position.toLowerCase()}?`);
    }
    if (p.nationality) {
      add("nationality", p.nationality, `Is your player from ${p.nationality}?`);
    }
    if (p.league) {
      add("league", p.league, `Does your player play in the ${p.league}?`);
    }
    if (p.team) {
      add("team", p.team, `Does your player play for ${p.team}?`);
    }

    // Rich attributes
    if (p.preferredFoot) {
      add("preferredFoot", p.preferredFoot, `Is your player primarily ${p.preferredFoot.toLowerCase()}-footed?`);
    }
    if (p.playStyle) {
      add("playStyle", p.playStyle, `Is your player's playstyle described as a ${p.playStyle.toLowerCase()}?`);
    }
    if (p.nationalTeam) {
      add("nationalTeam", p.nationalTeam, `Does your player represent ${p.nationalTeam} internationally?`);
    }

    // Numeric range attributes
    if (p.age) {
      add("age", ">=30", "Is your player 30 years old or older?");
      add("age", "<25", "Is your player younger than 25 years old?");
      add("age", String(p.age), `Is your player exactly ${p.age} years old?`);
    }
    if (p.goals) {
      add("goals", ">=15", "Has your player scored 15 or more goals this season?");
      add("goals", ">=10", "Has your player scored 10 or more goals this season?");
      add("goals", ">=5", "Has your player scored 5 or more goals this season?");
    }
    if (p.height) {
      add("height", ">=185", "Is your player 185 cm or taller?");
      add("height", "<180", "Is your player shorter than 180 cm?");
    }
    if (p.shirtNumber) {
      add("shirtNumber", "<=10", "Is your player's shirt number 10 or lower?");
      add("shirtNumber", ">10", "Is your player's shirt number greater than 10?");
      add("shirtNumber", String(p.shirtNumber), `Does your player wear the number ${p.shirtNumber} shirt?`);
    }
  });

  return list;
};

/**
 * Gets a distinguishing question for the remaining candidates using Maximum Information Gain.
 * @param {Object} session - The active game session.
 * @param {Array} scoredCandidates - List of {player, score} candidates sorted by score.
 * @returns {Promise<Object>} The selected question object.
 */
const { isQuestionValid, scoreQuestion, initKnownFacts } = require("./questionValidator");

/**
 * Gets a distinguishing question for the remaining candidates using Maximum Information Gain.
 * @param {Object} session - The active game session.
 * @param {Array} scoredCandidates - List of {player, score} candidates sorted by score.
 * @returns {Promise<Object>} The selected question object.
 */
const getBestQuestion = async (session, scoredCandidates) => {
  const questionHistory = session.questionHistory || [];
  
  // Make sure knownFacts exists
  if (!session.knownFacts) {
    session.knownFacts = initKnownFacts();
  }

  // 1. Identify active candidates pool for calculations (score within 20 of leader)
  const leaderScore = scoredCandidates[0]?.score || 0;
  let activeCandidates = scoredCandidates.filter((c) => leaderScore - c.score <= 20);
  
  // Guard: if pool is too small, use top candidates to ensure diversity in splits
  if (activeCandidates.length < 5) {
    activeCandidates = scoredCandidates.slice(0, 15);
  }
  
  const activePlayers = activeCandidates.map((c) => c.player);

  // 2. Try OpenAI Service first
  const openaiQuestion = await generateCustomQuestion(activePlayers, questionHistory);
  if (openaiQuestion) {
    const validation = isQuestionValid(openaiQuestion, session.knownFacts, questionHistory, activeCandidates);
    if (validation.valid) {
      const confidence = require("./scoringEngine").calculateConfidence(scoredCandidates);
      console.log(`\n================ [Footkinator AI LLM Log] ================`);
      console.log(`Current Candidates: ${activeCandidates.length}`);
      console.log(`Best Question (LLM): "${openaiQuestion.question}"`);
      console.log(`Attribute Targeted: ${openaiQuestion.attribute}`);
      console.log(`Confidence: ${confidence}%`);
      console.log(`========================================================\n`);
      
      return openaiQuestion;
    } else {
      console.log(`\n[LLM Rejected Question]: "${openaiQuestion.question}" (${openaiQuestion.attribute}: ${openaiQuestion.value})`);
      console.log(`Reason: ${validation.reason}\n`);
    }
  }

  // 3. Fallback to Algorithmic Fallback Engine with State-Aware Reasoning
  let candidateQuestions = getCandidateQuestions(activePlayers);

  if (candidateQuestions.length === 0) {
    const topPlayers = scoredCandidates.slice(0, 30).map(c => c.player);
    candidateQuestions = getCandidateQuestions(topPlayers);
  }

  const validQuestions = [];
  const rejectedQuestions = [];

  candidateQuestions.forEach((q) => {
    const validation = isQuestionValid(q, session.knownFacts, questionHistory, activeCandidates);
    if (validation.valid) {
      const scoreDetails = scoreQuestion(q, session.knownFacts, questionHistory, activeCandidates, session.answers);
      validQuestions.push({
        ...q,
        ...scoreDetails
      });
    } else {
      rejectedQuestions.push({
        ...q,
        reason: validation.reason
      });
    }
  });

  // Log Rejected Questions
  console.log(`\n================ [Footkinator AI Validation Log] ================`);
  console.log(`Rejected Questions count: ${rejectedQuestions.length}`);
  rejectedQuestions.forEach((rq) => {
    console.log(`- Rejected: "${rq.question}" [${rq.attribute}:${rq.value}] | Reason: ${rq.reason}`);
  });

  if (validQuestions.length === 0) {
    console.log(`Selected Question: None (No valid questions left)`);
    console.log(`=================================================================\n`);
    return null;
  }

  // Sort by finalScore descending
  validQuestions.sort((a, b) => b.finalScore - a.finalScore);
  const bestQuestion = validQuestions[0];

  // Log Selected Question
  console.log(`\nSelected Question: "${bestQuestion.question}"`);
  console.log(`- Attribute: ${bestQuestion.attribute} (Difficulty: ${bestQuestion.difficulty})`);
  console.log(`- Value: ${bestQuestion.value}`);
  console.log(`- Score Details:`);
  console.log(`  * Final Score: ${bestQuestion.finalScore.toFixed(4)}`);
  console.log(`  * Information Gain: ${bestQuestion.informationGain.toFixed(4)}`);
  console.log(`  * Novelty Bonus: ${bestQuestion.noveltyBonus.toFixed(4)}`);
  console.log(`  * Candidate Separation: ${bestQuestion.candidateSeparationScore.toFixed(4)}`);
  console.log(`  * Repetition Penalty: ${bestQuestion.repetitionPenalty.toFixed(4)}`);
  console.log(`  * Contradiction Penalty: ${bestQuestion.contradictionPenalty.toFixed(4)}`);
  console.log(`  * Difficulty Multiplier: ${bestQuestion.difficultyMultiplier.toFixed(4)}`);
  console.log(`  * Split: ${bestQuestion.yesCount} YES / ${bestQuestion.noCount} NO`);
  console.log(`=================================================================\n`);

  // Pre-calculate expectedAnswers for the top candidates
  const expectedAnswers = {};
  activeCandidates.forEach((c) => {
    const player = c.player || c;
    expectedAnswers[player.apiPlayerId] = evaluatePlayerMatch(player, bestQuestion.attribute, bestQuestion.value);
  });

  return {
    question: bestQuestion.question,
    attribute: bestQuestion.attribute,
    value: bestQuestion.value,
    informationGain: bestQuestion.informationGain,
    expectedSplit: `${bestQuestion.yesCount} YES / ${bestQuestion.noCount} NO`,
    expectedAnswers,
  };
};

module.exports = {
  getBestQuestion,
};

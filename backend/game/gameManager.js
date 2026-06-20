const crypto = require("crypto");
const Player = require("../models/Player");
const { getScoredCandidates, shouldGuess, calculateConfidence } = require("../ai/scoringEngine");
const { getBestQuestion } = require("../ai/llmQuestionGenerator");
const { initKnownFacts, updateKnownFacts } = require("../ai/questionValidator");

const sessions = new Map();
const completedGamesQuestionCounts = [];

const getAverageQuestionsToGuess = () => {
  if (completedGamesQuestionCounts.length === 0) return 0;
  const sum = completedGamesQuestionCounts.reduce((a, b) => a + b, 0);
  return Math.round((sum / completedGamesQuestionCounts.length) * 10) / 10;
};

const getKnownFactsSafe = (session) => {
  if (!session.knownFacts) {
    session.knownFacts = initKnownFacts();
    for (const ans of session.answers) {
      updateKnownFacts(session.knownFacts, ans.attribute, ans.value, ans.answer);
    }
  }
  return session.knownFacts;
};

const createGameSession = async () => {
  const players = await Player.find().sort({ createdAt: -1 });
  const gameId = crypto.randomUUID();

  const session = {
    gameId,
    candidates: players,
    questionHistory: [],
    answers: [],
    attributeHistory: [],
    knownFacts: initKnownFacts(),
    analytics: {
      questionsAsked: 0,
      unknownAnswers: 0,
      candidatesRemainingHistory: [players.length],
      confidenceProgression: [0],
      averageQuestionsToGuess: getAverageQuestionsToGuess(),
    }
  };

  sessions.set(gameId, session);

  return session;
};

const getGameSession = (gameId) => sessions.get(gameId);


const getBestSessionQuestion = async (gameId) => {
  const session = getGameSession(gameId);

  if (!session) {
    return null;
  }

  const scoredCandidates = getScoredCandidates(session);
  const bestQuestion = await getBestQuestion(session, scoredCandidates);

  if (bestQuestion) {
    session.questionHistory.push(bestQuestion);
    session.attributeHistory.push(bestQuestion.attribute);
  }

  return bestQuestion;
};

const answerSessionQuestion = (gameId, attribute, value, answer) => {
  const session = getGameSession(gameId);

  if (!session) {
    return null;
  }

  const matchedQuestion = session.questionHistory.find(
    (q) => q.attribute === attribute && q.value === value
  ) || session.questionHistory[session.questionHistory.length - 1];

  const scoredBefore = getScoredCandidates(session);
  const leaderScoreBefore = scoredBefore[0]?.score || 0;
  const activeBefore = scoredBefore.filter((c) => leaderScoreBefore - c.score <= 20);
  const beforeCandidateCount = activeBefore.length;

  if (matchedQuestion) {
    matchedQuestion.answer = answer;
    matchedQuestion.beforeCandidateCount = beforeCandidateCount;
  }

  const answerObj = {
    attribute,
    value,
    answer,
    beforeCandidateCount,
    expectedAnswers: matchedQuestion ? matchedQuestion.expectedAnswers : null,
    question: matchedQuestion ? matchedQuestion.question : null,
  };

  session.answers.push(answerObj);

  const knownFacts = getKnownFactsSafe(session);
  updateKnownFacts(knownFacts, attribute, value, answer);

  const scoredAfter = getScoredCandidates(session);
  const leaderScoreAfter = scoredAfter[0]?.score || 0;
  const activeAfter = scoredAfter.filter((c) => leaderScoreAfter - c.score <= 20);
  const afterCandidateCount = activeAfter.length;

  if (matchedQuestion) {
    matchedQuestion.afterCandidateCount = afterCandidateCount;
  }
  answerObj.afterCandidateCount = afterCandidateCount;

  const confidence = calculateConfidence(scoredAfter, session.answers);

  if (!session.analytics) {
    session.analytics = {
      questionsAsked: 0,
      unknownAnswers: 0,
      candidatesRemainingHistory: [],
      confidenceProgression: [],
      averageQuestionsToGuess: getAverageQuestionsToGuess(),
    };
  }

  session.analytics.questionsAsked = session.answers.length;
  session.analytics.unknownAnswers = session.answers.filter((a) => a.answer === "unknown").length;
  session.analytics.candidatesRemainingHistory.push(activeAfter.length);
  session.analytics.confidenceProgression.push(confidence);
  session.analytics.averageQuestionsToGuess = getAverageQuestionsToGuess();

  const result = {
    before: session.analytics.candidatesRemainingHistory[session.answers.length - 2] || session.candidates.length,
    after: activeAfter.length,
    remainingPlayers: activeAfter.map((c) => c.player),
    gameOver: false,
    analytics: session.analytics,
  };

  if (shouldGuess(scoredAfter, session.questionHistory.length)) {
    // Record completed question count for average analytics
    completedGamesQuestionCounts.push(session.questionHistory.length);
    session.analytics.averageQuestionsToGuess = getAverageQuestionsToGuess();
    
    const playerDoc = scoredAfter[0]?.player || null;
    let finalGuess = null;
    let explanation = "";
    
    if (playerDoc) {
      // Safely convert Mongoose document to plain JS object to allow serialization of custom fields
      finalGuess = playerDoc.toObject ? playerDoc.toObject() : { ...playerDoc };
      const { generateExplanation } = require("../ai/explanationEngine");
      explanation = generateExplanation(finalGuess, session.answers);
      finalGuess.explanation = explanation;
    }

    return {
      ...result,
      gameOver: true,
      guess: finalGuess,
      confidence,
      explanation,
      analytics: session.analytics,
    };
  }

  return result;
};

const getSessionState = (gameId) => {
  const session = getGameSession(gameId);

  if (!session) {
    return null;
  }

  const scoredCandidates = getScoredCandidates(session);
  const leaderScore = scoredCandidates[0]?.score || 0;
  const activeCandidates = scoredCandidates.filter((c) => leaderScore - c.score <= 20);

  return {
    candidateCount: activeCandidates.length,
    answers: session.answers,
    questionHistory: session.questionHistory,
    analytics: session.analytics || {
      questionsAsked: session.answers.length,
      candidatesRemainingHistory: [session.candidates.length],
      confidenceProgression: [0],
      averageQuestionsToGuess: getAverageQuestionsToGuess(),
    },
  };
};

module.exports = {
  answerSessionQuestion,
  createGameSession,
  getBestSessionQuestion,
  getGameSession,
  getSessionState,
};

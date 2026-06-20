const express = require("express");
const {
  answerSessionQuestion,
  createGameSession,
  getBestSessionQuestion,
  getGameSession,
  getSessionState,
} = require("../game/gameManager");
const { getScoredCandidates } = require("../ai/scoringEngine");

const router = express.Router();
const allowedAttributes = [
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

const validateGameSession = (gameId) => {
  const session = getGameSession(gameId);

  if (!session) {
    const error = new Error("Game session not found.");
    error.statusCode = 404;
    throw error;
  }

  return session;
};

router.post("/start", async (req, res, next) => {
  try {
    const session = await createGameSession();

    res.status(201).json({
      gameId: session.gameId,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/question/:gameId", async (req, res, next) => {
  try {
    validateGameSession(req.params.gameId);

    const bestQuestion = await getBestSessionQuestion(req.params.gameId);

    if (!bestQuestion) {
      res.status(404);
      throw new Error("No questions available for this game session.");
    }

    res.status(200).json(bestQuestion);
  } catch (error) {
    next(error);
  }
});

router.post("/answer/:gameId", (req, res, next) => {
  try {
    validateGameSession(req.params.gameId);

    const { attribute, value, answer } = req.body;

    if (!attribute || !allowedAttributes.includes(attribute)) {
      res.status(400);
      throw new Error(
        `attribute is required and must be one of: ${allowedAttributes.join(", ")}`
      );
    }

    if (value === undefined || value === null || value === "") {
      res.status(400);
      throw new Error("value is required.");
    }

    if (typeof answer !== "boolean" && answer !== "unknown") {
      res.status(400);
      throw new Error("answer is required and must be true, false, or 'unknown'.");
    }

    const result = answerSessionQuestion(
      req.params.gameId,
      attribute,
      value,
      answer
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.get("/state/:gameId", (req, res, next) => {
  try {
    validateGameSession(req.params.gameId);

    res.status(200).json(getSessionState(req.params.gameId));
  } catch (error) {
    next(error);
  }
});

router.get("/top-candidates/:gameId", (req, res, next) => {
  try {
    validateGameSession(req.params.gameId);

    const session = getGameSession(req.params.gameId);
    const scoredCandidates = getScoredCandidates(session);
    
    const topCandidates = scoredCandidates.slice(0, 5).map((c) => ({
      player: c.player,
      score: c.score,
    }));

    res.status(200).json(topCandidates);
  } catch (error) {
    next(error);
  }
});

router.get("/debug/:gameId", (req, res, next) => {
  try {
    validateGameSession(req.params.gameId);

    const session = getGameSession(req.params.gameId);
    const scoredCandidates = getScoredCandidates(session);
    
    const topCandidates = scoredCandidates.slice(0, 10).map((c) => ({
      player: {
        name: c.player.name,
        apiPlayerId: c.player.apiPlayerId,
        nationality: c.player.nationality,
        position: c.player.position,
        team: c.player.team,
        league: c.player.league,
        photo: c.player.photo
      },
      score: c.score
    }));

    res.status(200).json({
      candidateCount: scoredCandidates.length,
      topCandidates,
      allScores: scoredCandidates.map((c) => ({ name: c.player.name, score: c.score })),
      knownFacts: session.knownFacts,
      questionHistory: session.questionHistory
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

const express = require("express");
const {
  ensureCandidatePoolInitialized,
  initializeCandidatePool,
  getCandidates,
  getCandidateCount,
  setCandidates,
} = require("../ai/candidatePool");
const { generateQuestions } = require("../ai/questionGenerator");
const { filterCandidates } = require("../ai/eliminationEngine");
const { findBestQuestion } = require("../ai/informationGain");
const { makeGuess } = require("../ai/guessEngine");

const router = express.Router();
const allowedAttributes = ["position", "nationality", "age", "league", "team"];

router.get("/candidates", async (req, res, next) => {
  try {
    await initializeCandidatePool();

    res.status(200).json({
      count: getCandidateCount(),
      players: getCandidates(),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/candidates/count", async (req, res, next) => {
  try {
    await ensureCandidatePoolInitialized();

    res.status(200).json({
      count: getCandidateCount(),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/questions", async (req, res, next) => {
  try {
    const players = await ensureCandidatePoolInitialized();
    const questions = generateQuestions(players);

    res.status(200).json({
      count: questions.length,
      questions,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/eliminate", async (req, res, next) => {
  try {
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

    const candidates = await ensureCandidatePoolInitialized();
    const remainingPlayers = filterCandidates(candidates, attribute, value, answer);
    setCandidates(remainingPlayers);

    res.status(200).json({
      before: candidates.length,
      after: remainingPlayers.length,
      remainingPlayers,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/best-question", async (req, res, next) => {
  try {
    const candidates = await ensureCandidatePoolInitialized();
    const bestQuestion = findBestQuestion(candidates);

    if (!bestQuestion) {
      res.status(404);
      throw new Error("No questions available for the current candidate pool.");
    }

    res.status(200).json(bestQuestion);
  } catch (error) {
    next(error);
  }
});

router.post("/guess", (req, res, next) => {
  try {
    const { candidates } = req.body;

    if (!Array.isArray(candidates)) {
      res.status(400);
      throw new Error("candidates is required and must be an array.");
    }

    if (candidates.length === 0) {
      res.status(400);
      throw new Error("candidates must contain at least one player.");
    }

    const result = makeGuess(candidates);

    if (!result) {
      res.status(400);
      throw new Error("Unable to make a guess from the provided candidates.");
    }

    const { guess, confidence } = result;

    res.status(200).json({
      guess: {
        name: guess.name,
        team: guess.team,
        nationality: guess.nationality,
      },
      confidence,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

const express = require("express");
const Player = require("../models/Player");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const players = await Player.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: players.length,
      data: players,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/test", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Player model working",
  });
});

module.exports = router;

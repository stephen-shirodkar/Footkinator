const mongoose = require("mongoose");

const PlayerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    nationality: {
      type: String,
      required: true,
    },
    age: {
      type: Number,
    },
    position: {
      type: String,
      required: true,
    },
    team: {
      type: String,
    },
    league: {
      type: String,
    },
    photo: {
      type: String,
    },
    apiPlayerId: {
      type: Number,
      unique: true,
      sparse: true,
    },
    preferredFoot: {
      type: String,
    },
    height: {
      type: Number,
    },
    shirtNumber: {
      type: Number,
    },
    goals: {
      type: Number,
      default: 0,
    },
    assists: {
      type: Number,
      default: 0,
    },
    appearances: {
      type: Number,
      default: 0,
    },
    nationalTeam: {
      type: String,
    },
    marketValue: {
      type: String,
    },
    playStyle: {
      type: String,
    },
    roleDescription: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Player", PlayerSchema);

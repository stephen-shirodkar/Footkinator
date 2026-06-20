const Player = require("../models/Player");

let candidates = [];
let isInitialized = false;

const initializeCandidatePool = async () => {
  candidates = await Player.find().sort({ createdAt: -1 });
  isInitialized = true;
  return candidates;
};

const ensureCandidatePoolInitialized = async () => {
  if (!isInitialized) {
    return initializeCandidatePool();
  }

  return candidates;
};

const getCandidates = () => candidates;

const getCandidateCount = () => candidates.length;

const setCandidates = (nextCandidates) => {
  candidates = nextCandidates;
  isInitialized = true;
  return candidates;
};

module.exports = {
  ensureCandidatePoolInitialized,
  initializeCandidatePool,
  getCandidates,
  getCandidateCount,
  setCandidates,
};

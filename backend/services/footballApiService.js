const axios = require("axios");

const API_FOOTBALL_BASE_URL = "https://v3.football.api-sports.io";

const transformPlayer = (playerRecord) => {
  const player = playerRecord.player || {};
  const statistics = playerRecord.statistics || [];
  const primaryStats = statistics[0] || {};

  return {
    name: player.name,
    nationality: player.nationality,
    age: player.age,
    position: primaryStats.games?.position,
    team: primaryStats.team?.name,
    league: primaryStats.league?.name,
    photo: player.photo,
    apiPlayerId: player.id,
    appearances: primaryStats.games?.appearences || 0, // corrected spelling to match API response
  };
};

const callApiWithRetry = async (apiFn, retries = 3, delayMs = 3000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await apiFn();
      
      // API-Football returns error descriptions inside a 200 OK response under the `errors` key
      const errors = response.data?.errors;
      if (errors && Object.keys(errors).length > 0) {
        const errorStr = JSON.stringify(errors).toLowerCase();
        if (errorStr.includes("limit") || errorStr.includes("rate") || errorStr.includes("requests")) {
          if (attempt === retries) {
            throw new Error(`Rate limit exhausted after ${retries} attempts: ${JSON.stringify(errors)}`);
          }
          console.warn(`Rate limit indicator inside API response. Attempt ${attempt} of ${retries}. Backing off for ${delayMs * 2}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delayMs * 2));
          continue;
        }
        throw new Error(`API Error: ${JSON.stringify(errors)}`);
      }
      
      return response;
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      let backoff = delayMs * Math.pow(2, attempt - 1);
      if (error.message.includes("429") || (error.response && error.response.status === 429)) {
        backoff = 15000;
        console.warn(`HTTP 429 Rate Limit hit. Backing off for ${backoff}ms to reset quota window...`);
      } else {
        console.warn(`API call failed (Attempt ${attempt} of ${retries}): ${error.message}. Retrying in ${backoff}ms...`);
      }
      await new Promise((resolve) => setTimeout(resolve, backoff));
    }
  }
};

const fetchTeams = async (league, season) => {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    throw new Error("API_FOOTBALL_KEY is not defined in the environment.");
  }

  const callApi = () => axios.get(`${API_FOOTBALL_BASE_URL}/teams`, {
    headers: {
      "x-apisports-key": apiKey,
    },
    params: {
      league,
      season,
    },
  });

  const response = await callApiWithRetry(callApi);
  return response.data?.response || [];
};

const fetchTeamPlayers = async (team, season, page = 1) => {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    throw new Error("API_FOOTBALL_KEY is not defined in the environment.");
  }

  const callApi = () => axios.get(`${API_FOOTBALL_BASE_URL}/players`, {
    headers: {
      "x-apisports-key": apiKey,
    },
    params: {
      team,
      season,
      page,
    },
  });

  const response = await callApiWithRetry(callApi);
  const records = response.data?.response || [];
  return records.map(transformPlayer);
};

// Deprecated in favor of fetchTeamPlayers, keeping for backwards compatibility
const fetchPlayers = async () => {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    throw new Error("API_FOOTBALL_KEY is not defined in the environment.");
  }

  const league = process.env.API_FOOTBALL_LEAGUE || "39";
  const season = process.env.API_FOOTBALL_SEASON || "2023";
  const page = process.env.API_FOOTBALL_PAGE || "1";

  const callApi = () => axios.get(`${API_FOOTBALL_BASE_URL}/players`, {
    headers: {
      "x-apisports-key": apiKey,
    },
    params: {
      league,
      season,
      page,
    },
  });

  const response = await callApiWithRetry(callApi);
  const records = response.data?.response || [];
  return records
    .map(transformPlayer)
    .filter((player) => player.name && player.nationality && player.position);
};

module.exports = {
  fetchPlayers,
  fetchTeams,
  fetchTeamPlayers,
};

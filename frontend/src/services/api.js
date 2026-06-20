import axios from "axios";

const API_BASE_URL = "http://localhost:5001";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const getErrorMessage = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (error.message) {
    return error.message;
  }

  return "Something went wrong while contacting the backend.";
};

const request = async (apiCall) => {
  try {
    const response = await apiCall();
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

const startGame = () => request(() => apiClient.post("/game/start"));

const getGameQuestion = (gameId) =>
  request(() => apiClient.get(`/game/question/${gameId}`));

const submitGameAnswer = (gameId, attribute, value, answer) =>
  request(() =>
    apiClient.post(`/game/answer/${gameId}`, {
      attribute,
      value,
      answer,
    })
  );

const getGameState = (gameId) =>
  request(() => apiClient.get(`/game/state/${gameId}`));

export {
  API_BASE_URL,
  getGameQuestion,
  getGameState,
  startGame,
  submitGameAnswer,
};

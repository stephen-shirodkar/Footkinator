import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getGameQuestion, startGame } from "../services/api";

function Home() {
  const navigate = useNavigate();
  const [backendQuestion, setBackendQuestion] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const handleStartGame = async () => {
    setIsStarting(true);
    setErrorMessage("");

    try {
      const data = await startGame();

      localStorage.setItem("footkinatorGameId", data.gameId);
      navigate("/game", {
        state: {
          gameId: data.gameId,
        },
      });
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsStarting(false);
    }
  };

  const handleTestConnection = async () => {
    setIsLoading(true);
    setBackendQuestion("");
    setStatusMessage("");
    setErrorMessage("");

    try {
      const gameData = await startGame();
      const questionData = await getGameQuestion(gameData.gameId);

      setStatusMessage("Backend Connected");
      setBackendQuestion(questionData.question);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="home-page">
      <div className="hero-copy">
        <p className="eyebrow">Football guessing game</p>
        <h1>Footkinator</h1>
        <p className="hero-text">
          Think of a football player and I will guess who it is.
        </p>
        <button
          className="primary-button"
          type="button"
          onClick={handleStartGame}
          disabled={isStarting}
        >
          {isStarting ? "Starting..." : "Start Game"}
        </button>

        <div className="connection-test">
          <button
            className="secondary-button"
            type="button"
            onClick={handleTestConnection}
            disabled={isLoading}
          >
            {isLoading ? "Testing..." : "Test Backend Connection"}
          </button>

          {statusMessage && (
            <div className="connection-result" role="status">
              <p className="connection-status">{statusMessage}</p>
              <p className="connection-label">Question:</p>
              <p className="connection-question">{backendQuestion}</p>
            </div>
          )}

          {errorMessage && (
            <div className="connection-error" role="alert">
              {errorMessage}
            </div>
          )}
        </div>
      </div>

      <div className="pitch-visual" aria-hidden="true">
        <div className="pitch-line center-line" />
        <div className="pitch-circle" />
        <div className="goal-box left" />
        <div className="goal-box right" />
        <div className="football-dot one" />
        <div className="football-dot two" />
        <div className="football-dot three" />
      </div>
    </section>
  );
}

export default Home;

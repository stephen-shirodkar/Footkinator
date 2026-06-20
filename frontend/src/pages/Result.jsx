import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import PlayerCard from "../components/PlayerCard";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 16,
    },
  },
};

function Result() {
  const location = useLocation();
  const navigate = useNavigate();

  const storedGuess = localStorage.getItem("footkinatorGuess");
  const guess = location.state?.guess || (storedGuess ? JSON.parse(storedGuess) : null);

  const storedConfidence = localStorage.getItem("footkinatorConfidence");
  const confidence = location.state?.confidence !== undefined
    ? location.state.confidence
    : (storedConfidence ? JSON.parse(storedConfidence) : 100);

  const handlePlayAgain = () => {
    localStorage.removeItem("footkinatorGameId");
    localStorage.removeItem("footkinatorGuess");
    localStorage.removeItem("footkinatorConfidence");
    localStorage.removeItem("footkinatorInitialCount");
    navigate("/");
  };

  return (
    <section className="page-panel result-page-container">
      {guess ? (
        <motion.div
          className="result-content-card"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.header className="result-header" variants={itemVariants}>
            <span className="result-badge-top">Guessed Player</span>
            <h1 className="result-title">Result Revealed!</h1>
            <p className="result-subtitle">Here is the player I think you had in mind:</p>
          </motion.header>

          <motion.div style={{ width: "100%" }} variants={itemVariants}>
            <PlayerCard
              photo={guess.photo}
              name={guess.name}
              team={guess.team || "Unknown Team"}
              nationality={guess.nationality || "Unknown Nationality"}
              confidence={confidence}
            />
          </motion.div>

          {guess.explanation && (
            <motion.div 
              className="explanation-box" 
              variants={itemVariants}
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "16px",
                padding: "20px 24px",
                marginTop: "20px",
                width: "100%",
                boxSizing: "border-box",
                textAlign: "left",
              }}
            >
              <h3 style={{ margin: "0 0 14px 0", fontSize: "1.15rem", fontWeight: 900, color: "#ffd700", display: "flex", alignItems: "center", gap: "8px", textShadow: "0 0 6px rgba(255, 215, 0, 0.2)" }}>
                <span>🔍</span> Why this guess?
              </h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                {guess.explanation.split("\n").map((line, idx) => (
                  <li key={idx} style={{ fontSize: "1.02rem", color: "#cbd5e1", fontWeight: 500, display: "flex", alignItems: "center", gap: "8px" }}>
                    {line}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          <motion.div className="result-actions" variants={itemVariants}>
            <motion.button
              onClick={handlePlayAgain}
              className="primary-button play-again-button"
              type="button"
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              ⚽ Play Again
            </motion.button>
          </motion.div>
        </motion.div>
      ) : (
        <div className="game-state-card result-error-card">
          <p>No active game results found.</p>
          <button 
            className="primary-button play-again-button" 
            onClick={() => navigate("/")}
            type="button"
          >
            Start New Game
          </button>
        </div>
      )}
    </section>
  );
}

export default Result;

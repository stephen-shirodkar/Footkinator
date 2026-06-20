import { motion } from "framer-motion";

function ProgressBar({ progress = 0, initial = null, remaining = null, eliminated = 0 }) {
  // Ensure progress is constrained between 0 and 100
  const cleanProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className="game-progress-wrapper" aria-label="Game progress and player stats">
      <div className="progress-bar-container">
        <div className="progress-track">
          <motion.div 
            className="progress-fill" 
            animate={{ width: `${cleanProgress}%` }}
            transition={{ type: "spring", stiffness: 60, damping: 14 }}
          >
            <motion.div 
              className="progress-ball-handle"
              style={{ y: "-50%" }}
              animate={{ rotate: cleanProgress * 8 }}
              transition={{ type: "spring", stiffness: 60, damping: 14 }}
            >
              ⚽
            </motion.div>
          </motion.div>
        </div>
        <div className="progress-percentage-label">{cleanProgress}% Narrowed Down</div>
      </div>

      <div className="game-stats-dashboard">
        <div className="game-stat-card initial-pool">
          <span className="stat-icon">👥</span>
          <div className="stat-info">
            <span className="stat-label">Initial Pool</span>
            <div style={{ overflow: "hidden" }}>
              <motion.span
                key={initial}
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                style={{ display: "inline-block" }}
                className="stat-value"
              >
                {initial !== null ? initial : "--"}
              </motion.span>
            </div>
          </div>
        </div>

        <div className="game-stat-card current-remaining">
          <span className="stat-icon">🎯</span>
          <div className="stat-info">
            <span className="stat-label">Remaining</span>
            <div style={{ overflow: "hidden" }}>
              <motion.span
                key={remaining}
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                style={{ display: "inline-block" }}
                className="stat-value highlight"
              >
                {remaining !== null ? remaining : "--"}
              </motion.span>
            </div>
          </div>
        </div>

        <div className="game-stat-card pool-eliminated">
          <span className="stat-icon">❌</span>
          <div className="stat-info">
            <span className="stat-label">Eliminated</span>
            <div style={{ overflow: "hidden" }}>
              <motion.span
                key={eliminated}
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                style={{ display: "inline-block" }}
                className="stat-value danger"
              >
                {eliminated}
              </motion.span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProgressBar;

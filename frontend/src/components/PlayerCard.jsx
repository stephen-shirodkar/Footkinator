import { useState } from "react";
import footballPlaceholder from "../assets/football_placeholder.png";

function PlayerCard({ photo, name, team, nationality, confidence }) {
  const [imageSrc, setImageSrc] = useState(photo || footballPlaceholder);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleImageError = () => {
    if (!hasError) {
      setImageSrc(footballPlaceholder);
      setHasError(true);
      setIsImageLoading(false);
    }
  };

  const handleImageLoad = () => {
    setIsImageLoading(false);
  };

  return (
    <article className="enhanced-player-card">
      <div className="player-avatar-container">
        {isImageLoading && <div className="avatar-loading-skeleton" />}
        <img
          src={imageSrc}
          alt={name || "Guessed Football Player"}
          className={`player-photo-avatar ${isImageLoading ? "hidden" : "visible"}`}
          onError={handleImageError}
          onLoad={handleImageLoad}
        />
      </div>

      <div className="player-info-container">
        <h2 className="player-card-name">{name || "Unknown Player"}</h2>
        
        <div className="player-badges-row">
          <span className="player-badge team-badge">
            <span className="badge-icon">⚽</span> {team || "Unknown Team"}
          </span>
          <span className="player-badge nationality-badge">
            <span className="badge-icon">🌍</span> {nationality || "Unknown Nationality"}
          </span>
        </div>

        {confidence !== undefined && (
          <div className="confidence-meter-container">
            <div className="confidence-header">
              <span className="confidence-label">AI Confidence Score</span>
              <span className="confidence-value">{Math.round(confidence)}%</span>
            </div>
            <div className="confidence-bar-track">
              <div 
                className="confidence-bar-fill" 
                style={{ width: `${Math.min(Math.max(confidence, 0), 100)}%` }} 
              />
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

export default PlayerCard;

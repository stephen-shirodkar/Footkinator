import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import AnswerButtons from "../components/AnswerButtons";
import ProgressBar from "../components/ProgressBar";
import QuestionCard from "../components/QuestionCard";
import {
  getGameQuestion,
  getGameState,
  submitGameAnswer,
} from "../services/api";

function Game() {
  const location = useLocation();
  const navigate = useNavigate();
  const [gameId] = useState(
    location.state?.gameId || localStorage.getItem("footkinatorGameId")
  );
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [remainingCount, setRemainingCount] = useState(null);
  const [initialCount, setInitialCount] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [lastAnswer, setLastAnswer] = useState("");

  useEffect(() => {
    const loadInitialQuestion = async () => {
      if (!gameId) {
        setErrorMessage("No active game session found. Start a new game first.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage("");

      try {
        const stateData = await getGameState(gameId);
        const questionData = await getGameQuestion(gameId);

        setRemainingCount(stateData.candidateCount);
        
        let initial = localStorage.getItem("footkinatorInitialCount");
        const answersCount = stateData.answers?.length || 0;
        if (!initial || answersCount === 0) {
          initial = stateData.candidateCount.toString();
          localStorage.setItem("footkinatorInitialCount", initial);
        }
        setInitialCount(parseInt(initial, 10));

        setCurrentQuestion(questionData);
        setQuestionNumber(answersCount + 1);
      } catch (error) {
        setErrorMessage(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialQuestion();
  }, [gameId]);

  const handleAnswer = async (answer) => {
    if (!currentQuestion || isProcessing) {
      return;
    }

    if (answer === "unknown") {
      setLastAnswer("I DON'T KNOW");
    } else {
      setLastAnswer(answer ? "YES" : "NO");
    }
    console.log(answer);
    setIsProcessing(true);
    setErrorMessage("");

    try {
      const answerResult = await submitGameAnswer(
        gameId,
        currentQuestion.attribute,
        currentQuestion.value,
        answer
      );

      if (answerResult.gameOver) {
        localStorage.setItem(
          "footkinatorGuess",
          JSON.stringify(answerResult.guess)
        );
        localStorage.setItem(
          "footkinatorConfidence",
          JSON.stringify(answerResult.confidence || 100)
        );
        navigate("/result", {
          state: {
            guess: answerResult.guess,
            confidence: answerResult.confidence,
          },
        });
        return;
      }

      const stateData = await getGameState(gameId);
      const nextQuestion = await getGameQuestion(gameId);

      setRemainingCount(stateData.candidateCount);
      setCurrentQuestion(nextQuestion);
      setQuestionNumber((currentNumber) => currentNumber + 1);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const eliminatedCount = initialCount !== null && remainingCount !== null
    ? Math.max(0, initialCount - remainingCount)
    : 0;

  const progressPercent = initialCount > 1
    ? Math.min(Math.round((eliminatedCount / (initialCount - 1)) * 100), 100)
    : 0;

  return (
    <section className="page-panel game-page" style={{ maxWidth: "680px", padding: "40px 16px" }}>
      <div className="game-header-banner" style={{ textAlign: "center", marginBottom: "32px" }}>
        <h1 style={{ color: "#ffd700", fontSize: "2.2rem", fontWeight: 900, margin: "0 0 6px 0", letterSpacing: "0.08em", textShadow: "0 0 12px rgba(255, 215, 0, 0.35)" }}>
          ⚽ FOOTKINATOR
        </h1>
        <p style={{ color: "#cbd5e1", fontSize: "1.1rem", fontWeight: 500, margin: 0, opacity: 0.9 }}>
          Think of any football player and I’ll guess who it is.
        </p>
      </div>

      <ProgressBar
        progress={progressPercent}
        initial={initialCount}
        remaining={remainingCount}
        eliminated={eliminatedCount}
      />

      <AnimatePresence>
        {isLoading && (
          <motion.div 
            className="game-state-card loading-container"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "50px 40px" }}
          >
            <motion.div
              style={{ display: "inline-block", fontSize: "3.2rem" }}
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
            >
              ⚽
            </motion.div>
            <motion.p
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              style={{ margin: 0, fontWeight: 900, color: "#ffd700", fontSize: "1.25rem", letterSpacing: "0.02em" }}
            >
              Preparing football pitch...
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {errorMessage && (
        <div className="game-error-card" role="alert">
          <p>{errorMessage}</p>
          {!gameId && (
            <Link className="inline-action" to="/">
              Start a new game
            </Link>
          )}
        </div>
      )}

      {!isLoading && !errorMessage && currentQuestion && (
        <>
          <div className="game-meta" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", padding: "0 4px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              📋 Question {questionNumber}
            </span>
            {remainingCount !== null && (
              <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "#22c55e" }}>
                👥 Remaining: {remainingCount}
              </span>
            )}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={questionNumber}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              style={{ display: "flex", flexDirection: "column", gap: "24px" }}
            >
              <QuestionCard question={currentQuestion.question} />
              <AnswerButtons onAnswer={handleAnswer} disabled={isProcessing} />
            </motion.div>
          </AnimatePresence>

          <AnimatePresence>
            {isProcessing && (
              <motion.div 
                className="game-state-card compact loading-container"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginTop: "24px" }}
              >
                <motion.span
                  style={{ display: "inline-block", fontSize: "1.6rem" }}
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                >
                  ⚽
                </motion.span>
                <motion.span
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                  style={{ fontWeight: 800, color: "#ffd700" }}
                >
                  Analyzing coordinates...
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>

          {lastAnswer && (
            <p className="answer-status" style={{ marginTop: "20px", color: "#94a3b8" }}>
              Last answer captured:{" "}
              <strong
                style={{
                  color:
                    lastAnswer === "YES"
                      ? "#22c55e"
                      : lastAnswer === "NO"
                      ? "#ef4444"
                      : "#94a3b8",
                }}
              >
                {lastAnswer}
              </strong>
            </p>
          )}
        </>
      )}
    </section>
  );
}

export default Game;

import { motion } from "framer-motion";

function AnswerButtons({ disabled = false, onAnswer }) {
  return (
    <div className="answer-buttons">
      {/* AnswerButtons captures the player's yes/no/idk response for the current question. */}
      <motion.button 
        className="btn-yes"
        type="button" 
        onClick={() => onAnswer(true)} 
        disabled={disabled}
        whileHover={disabled ? {} : { scale: 1.05, y: -2 }}
        whileTap={disabled ? {} : { scale: 0.96 }}
      >
        YES
      </motion.button>
      <motion.button 
        className="btn-no"
        type="button" 
        onClick={() => onAnswer(false)} 
        disabled={disabled}
        whileHover={disabled ? {} : { scale: 1.05, y: -2 }}
        whileTap={disabled ? {} : { scale: 0.96 }}
      >
        NO
      </motion.button>
      <motion.button 
        className="btn-idk"
        type="button" 
        onClick={() => onAnswer("unknown")} 
        disabled={disabled}
        whileHover={disabled ? {} : { scale: 1.05, y: -2 }}
        whileTap={disabled ? {} : { scale: 0.96 }}
      >
        I DON'T KNOW
      </motion.button>
    </div>
  );
}

export default AnswerButtons;

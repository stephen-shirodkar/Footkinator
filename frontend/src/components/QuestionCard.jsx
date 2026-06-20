import { motion, AnimatePresence } from "framer-motion";

function QuestionCard({ question }) {
  return (
    <AnimatePresence mode="wait">
      <motion.article
        key={question}
        className="question-card"
        initial={{ opacity: 0, y: 15, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -15, scale: 0.98 }}
        transition={{ duration: 0.22, ease: "easeInOut" }}
      >
        <p>{question}</p>
      </motion.article>
    </AnimatePresence>
  );
}

export default QuestionCard;

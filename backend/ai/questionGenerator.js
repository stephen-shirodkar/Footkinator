const questionTemplates = {
  position: (value) => `Is your player a ${value}?`,
  nationality: (value) => `Is your player from ${value}?`,
  age: (value) => `Is your player ${value} years old?`,
  league: (value) => `Does your player play in ${value}?`,
  team: (value) => `Does your player play for ${value}?`,
};

const questionAttributes = ["position", "nationality", "age", "league", "team"];

const generateQuestions = (players) => {
  const questions = [];
  const seenQuestions = new Set();

  players.forEach((player) => {
    questionAttributes.forEach((attribute) => {
      const value = player[attribute];

      if (value === undefined || value === null || value === "") {
        return;
      }

      const questionKey = `${attribute}:${value}`;

      if (seenQuestions.has(questionKey)) {
        return;
      }

      seenQuestions.add(questionKey);
      questions.push({
        attribute,
        value,
        question: questionTemplates[attribute](value),
      });
    });
  });

  return questions;
};

module.exports = {
  generateQuestions,
};

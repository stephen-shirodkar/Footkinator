/**
 * Generates an explainable AI justification for guessing a particular player.
 * @param {Object} player - The player object that is guessed.
 * @param {Array} answers - List of answers in the session.
 * @returns {string} Multiline string containing bullet points of match justifications.
 */
const generateExplanation = (player, answers) => {
  const bulletPoints = [];

  for (const ans of answers) {
    let matches = false;
    
    if (ans.expectedAnswers && typeof ans.expectedAnswers === "object") {
      const expected = ans.expectedAnswers[player.apiPlayerId];
      if (expected !== undefined && expected !== null) {
        matches = expected === ans.answer;
      } else {
        matches = ans.answer === false;
      }
    } else {
      // Attribute comparison
      const playerVal = player[ans.attribute];
      const isMatch = playerVal !== undefined && playerVal !== null && 
        String(playerVal).toLowerCase() === String(ans.value).toLowerCase();
      matches = ans.answer ? isMatch : !isMatch;
    }

    if (matches) {
      if (ans.answer === true) {
        switch (ans.attribute) {
          case "position":
            bulletPoints.push(`✓ Position: ${player.position}`);
            break;
          case "nationality":
            bulletPoints.push(`✓ Nationality: ${player.nationality}`);
            break;
          case "team":
            bulletPoints.push(`✓ Team: ${player.team}`);
            break;
          case "league":
            bulletPoints.push(`✓ League: ${player.league}`);
            break;
          case "preferredFoot":
            bulletPoints.push(`✓ ${player.preferredFoot}-Footed`);
            break;
          case "playStyle":
            bulletPoints.push(`✓ Playstyle: ${player.playStyle}`);
            break;
          case "goals":
            bulletPoints.push(`✓ Goals scored: ${player.goals}`);
            break;
          case "height":
            bulletPoints.push(`✓ Height: ${player.height} cm`);
            break;
          case "shirtNumber":
            bulletPoints.push(`✓ Shirt Number: ${player.shirtNumber}`);
            break;
          default:
            if (ans.question) {
              const cleaned = ans.question
                .replace(/^Is your player /, "")
                .replace(/^Does your player /, "")
                .replace(/^Has your player /, "")
                .replace(/\?$/, "");
              bulletPoints.push(`✓ ${cleaned.charAt(0).toUpperCase() + cleaned.slice(1)}`);
            } else {
              bulletPoints.push(`✓ Matches ${ans.attribute}: ${ans.value}`);
            }
        }
      } else {
        // Matches NO answer
        switch (ans.attribute) {
          case "position":
            bulletPoints.push(`✓ Not a ${ans.value}`);
            break;
          case "team":
            bulletPoints.push(`✓ Does not play for ${ans.value}`);
            break;
          case "league":
            bulletPoints.push(`✓ Does not play in ${ans.value}`);
            break;
          case "nationality":
            bulletPoints.push(`✓ Not from ${ans.value}`);
            break;
        }
      }
    }
  }

  // Ensure unique bullet points
  const uniquePoints = Array.from(new Set(bulletPoints)).slice(0, 5);

  // Fallback defaults if list is too short
  if (uniquePoints.length < 3) {
    if (player.team && !uniquePoints.some(p => p.includes("Team"))) {
      uniquePoints.push(`✓ Team: ${player.team}`);
    }
    if (player.nationality && !uniquePoints.some(p => p.includes("Nationality"))) {
      uniquePoints.push(`✓ Nationality: ${player.nationality}`);
    }
    if (player.position && !uniquePoints.some(p => p.includes("Position"))) {
      uniquePoints.push(`✓ Position: ${player.position}`);
    }
  }

  return uniquePoints.join("\n");
};

module.exports = {
  generateExplanation,
};

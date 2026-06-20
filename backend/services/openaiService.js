const { OpenAI } = require("openai");

let openai = null;

const getOpenAIClient = () => {
  if (openai) return openai;
  
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    console.warn("OPENAI_API_KEY is not defined in the environment. LLM Question Generation will fall back to rule-based generation.");
    return null;
  }
  
  openai = new OpenAI({
    apiKey: apiKey,
  });
  return openai;
};

/**
 * Generates the single best yes/no question that maximally distinguishes the top football players.
 * @param {Array} topCandidates - List of player objects (the top candidates).
 * @param {Array} questionHistory - List of questions already asked in this session.
 * @returns {Promise<{question: string, attribute: string, expectedAnswers: Object} | null>}
 */
const generateCustomQuestion = async (topCandidates, questionHistory = []) => {
  try {
    const client = getOpenAIClient();
    if (!client) return null;

    if (!topCandidates || topCandidates.length < 2) {
      return null;
    }

    // Prepare a lightweight array of players with their key profile attributes
    const playerSummaries = topCandidates.map((c) => {
      const p = c.player || c;
      return {
        apiPlayerId: p.apiPlayerId,
        name: p.name,
        position: p.position,
        team: p.team,
        league: p.league,
        nationality: p.nationality,
        age: p.age,
        preferredFoot: p.preferredFoot,
        height: p.height ? `${p.height}cm` : undefined,
        shirtNumber: p.shirtNumber,
        goals: p.goals,
        assists: p.assists,
        appearances: p.appearances,
        nationalTeam: p.nationalTeam,
        playStyle: p.playStyle,
      };
    });

    const askedQuestionsSummary = questionHistory.map((q) => `${q.attribute}:${q.value || ""}`).join(", ");

    const systemPrompt = `You are a football expert playing Akinator. Your goal is to analyze the top remaining candidate players and generate the single best yes/no question that splits them as evenly as possible.
For example, if you have 4 players, generate a question where 2 players are YES (true) and 2 players are NO (false).

You must respond ONLY with a valid JSON object matching this schema:
{
  "question": "A clear, natural-sounding yes/no question (e.g., 'Does your player play on the left wing?' or 'Has your player scored more than 15 goals this season?')",
  "attribute": "The attribute category (e.g. 'position', 'goals', 'preferredFoot', 'team', 'nationality', 'playStyle')",
  "expectedAnswers": {
    "apiPlayerId_as_string": true_or_false
  }
}

Constraints:
1. The keys of "expectedAnswers" MUST be the exact apiPlayerId (as strings) of the candidates provided.
2. The values of "expectedAnswers" MUST be booleans (true for yes, false for no).
3. Do NOT repeat or ask about attributes/values similar to: ${askedQuestionsSummary}.
4. Provide a valid JSON response. Do not include markdown code block syntax (like \`\`\`json) or any explanation outside the JSON.`;

    const userPrompt = `Here are the top candidates:
${JSON.stringify(playerSummaries, null, 2)}

Generate the single best yes/no question.`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;

    const result = JSON.parse(content);
    
    // Simple validation
    if (result.question && result.attribute && result.expectedAnswers) {
      return {
        question: result.question,
        attribute: result.attribute,
        value: result.value || result.question, // Fallback if no exact value but we store question text
        expectedAnswers: result.expectedAnswers,
      };
    }

    return null;
  } catch (error) {
    console.error("Error generating question from OpenAI:", error);
    return null;
  }
};

module.exports = {
  generateCustomQuestion,
};

const dotenv = require("dotenv");
const path = require("path");
const connectDB = require("../config/db");
const Player = require("../models/Player");

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

const legends = [
  {
    name: "Cristiano Ronaldo",
    nationality: "Portugal",
    age: 39,
    position: "Attacker",
    team: "Al Nassr",
    league: "Saudi Pro League",
    photo: "https://media.api-sports.io/football/players/874.png",
    apiPlayerId: 874,
    preferredFoot: "Right",
    height: 187,
    shirtNumber: 7,
    goals: 35,
    assists: 11,
    appearances: 31,
    nationalTeam: "Portugal",
    marketValue: "€15M",
    playStyle: "Inside Forward",
    roleDescription: "A legendary forward known for his incredible goalscoring, athleticism, and clutch performance."
  },
  {
    name: "Lionel Messi",
    nationality: "Argentina",
    age: 36,
    position: "Attacker",
    team: "Inter Miami",
    league: "MLS",
    photo: "https://media.api-sports.io/football/players/154.png",
    apiPlayerId: 154,
    preferredFoot: "Left",
    height: 170,
    shirtNumber: 10,
    goals: 23,
    assists: 15,
    appearances: 29,
    nationalTeam: "Argentina",
    marketValue: "€30M",
    playStyle: "Winger",
    roleDescription: "A legendary playmaker and dribbler, widely considered one of the greatest football players of all time."
  },
  {
    name: "Erling Haaland",
    nationality: "Norway",
    age: 23,
    position: "Attacker",
    team: "Manchester City",
    league: "Premier League",
    photo: "https://media.api-sports.io/football/players/1100.png",
    apiPlayerId: 1100,
    preferredFoot: "Left",
    height: 194,
    shirtNumber: 9,
    goals: 27,
    assists: 5,
    appearances: 31,
    nationalTeam: "Norway",
    marketValue: "€180M",
    playStyle: "Poacher",
    roleDescription: "A powerful, clinical striker who excels at finishing inside the penalty box with explosive pace."
  },
  {
    name: "Kylian Mbappé",
    nationality: "France",
    age: 25,
    position: "Attacker",
    team: "Real Madrid",
    league: "La Liga",
    photo: "https://media.api-sports.io/football/players/276.png",
    apiPlayerId: 276,
    preferredFoot: "Right",
    height: 178,
    shirtNumber: 9,
    goals: 27,
    assists: 7,
    appearances: 29,
    nationalTeam: "France",
    marketValue: "€180M",
    playStyle: "Inside Forward",
    roleDescription: "A blistering fast forward with elite dribbling and finishing who cuts inside to create havoc."
  },
  {
    name: "Kevin De Bruyne",
    nationality: "Belgium",
    age: 32,
    position: "Midfielder",
    team: "Manchester City",
    league: "Premier League",
    photo: "https://media.api-sports.io/football/players/629.png",
    apiPlayerId: 629,
    preferredFoot: "Right",
    height: 181,
    shirtNumber: 17,
    goals: 4,
    assists: 10,
    appearances: 18,
    nationalTeam: "Belgium",
    marketValue: "€60M",
    playStyle: "Advanced Playmaker",
    roleDescription: "A world-class midfielder with exceptional crossing, vision, and long-range passing."
  },
  {
    name: "Bukayo Saka",
    nationality: "England",
    age: 22,
    position: "Attacker",
    team: "Arsenal",
    league: "Premier League",
    photo: "https://media.api-sports.io/football/players/1457.png",
    apiPlayerId: 1457,
    preferredFoot: "Left",
    height: 178,
    shirtNumber: 7,
    goals: 16,
    assists: 9,
    appearances: 35,
    nationalTeam: "England",
    marketValue: "€130M",
    playStyle: "Winger",
    roleDescription: "A versatile, creative winger who excels at 1v1 duels and combines well with overlapping support."
  },
  {
    name: "Mohamed Salah",
    nationality: "Egypt",
    age: 32,
    position: "Attacker",
    team: "Liverpool",
    league: "Premier League",
    photo: "https://media.api-sports.io/football/players/306.png",
    apiPlayerId: 306,
    preferredFoot: "Left",
    height: 175,
    shirtNumber: 11,
    goals: 18,
    assists: 10,
    appearances: 32,
    nationalTeam: "Egypt",
    marketValue: "€55M",
    playStyle: "Inside Forward",
    roleDescription: "A prolific, rapid wide forward known for clinical finishing and cutting inside from the right wing."
  },
  {
    name: "Jude Bellingham",
    nationality: "England",
    age: 20,
    position: "Midfielder",
    team: "Real Madrid",
    league: "La Liga",
    photo: "https://media.api-sports.io/football/players/1359.png",
    apiPlayerId: 1359,
    preferredFoot: "Right",
    height: 186,
    shirtNumber: 5,
    goals: 19,
    assists: 6,
    appearances: 28,
    nationalTeam: "England",
    marketValue: "€180M",
    playStyle: "Box-to-Box Midfielder",
    roleDescription: "A dynamic and mature young midfielder who scores late runs into the box and dictates midfield play."
  },
  {
    name: "Harry Kane",
    nationality: "England",
    age: 30,
    position: "Attacker",
    team: "Bayern Munich",
    league: "Bundesliga",
    photo: "https://media.api-sports.io/football/players/184.png",
    apiPlayerId: 184,
    preferredFoot: "Right",
    height: 188,
    shirtNumber: 9,
    goals: 36,
    assists: 8,
    appearances: 32,
    nationalTeam: "England",
    marketValue: "€110M",
    playStyle: "Target Man",
    roleDescription: "A complete forward who combines elite goalscoring inside the box with playmaking and deep drop-ins."
  },
  {
    name: "Virgil van Dijk",
    nationality: "Netherlands",
    age: 32,
    position: "Defender",
    team: "Liverpool",
    league: "Premier League",
    photo: "https://media.api-sports.io/football/players/290.png",
    apiPlayerId: 290,
    preferredFoot: "Right",
    height: 195,
    shirtNumber: 4,
    goals: 2,
    assists: 2,
    appearances: 36,
    nationalTeam: "Netherlands",
    marketValue: "€32M",
    playStyle: "Ball-playing Defender",
    roleDescription: "A commanding center-back with outstanding aerial presence, positioning, and leadership on the pitch."
  }
];

const insertLegends = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await connectDB();
    console.log("Database connected successfully.");

    let insertedCount = 0;

    for (const legend of legends) {
      // Prevent duplicates by name or apiPlayerId
      const existing = await Player.findOne({ 
        $or: [
          { name: legend.name },
          { apiPlayerId: legend.apiPlayerId }
        ]
      });

      if (existing) {
        console.log(`Player ${legend.name} already exists. Skipping.`);
        continue;
      }

      await Player.create(legend);
      insertedCount++;
      console.log(`Inserted ${legend.name} into the database.`);
    }

    console.log(`Legendary players insertion complete. Inserted ${insertedCount} players.`);
    process.exit(0);
  } catch (error) {
    console.error("Error inserting legends:", error.message);
    process.exit(1);
  }
};

insertLegends();

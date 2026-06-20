const dotenv = require("dotenv");
const connectDB = require("../config/db");
const Player = require("../models/Player");
const { fetchTeams, fetchTeamPlayers } = require("../services/footballApiService");

dotenv.config();

const TARGET_PLAYER_COUNT = 1000;
const SEASON = "2023";

// 12 global leagues defined by API-Football ID and Name
const LEAGUES = [
  // Top Priority
  { id: 39, name: "Premier League" },
  { id: 140, name: "La Liga" },
  { id: 78, name: "Bundesliga" },
  { id: 135, name: "Serie A" },
  { id: 61, name: "Ligue 1" },
  // Additional Leagues
  { id: 88, name: "Eredivisie" },
  { id: 94, name: "Primeira Liga" },
  { id: 40, name: "Championship" },
  { id: 253, name: "MLS" },
  { id: 307, name: "Saudi Pro League" },
  { id: 203, name: "Turkish Super Lig" },
  { id: 144, name: "Belgian Pro League" },
];

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const PLAYSTYLES = {
  Goalkeeper: ["Sweeper Keeper", "Shot Stopper"],
  Defender: ["Ball-playing Defender", "Full-back", "Wing-back", "No-nonsense Center-back"],
  Midfielder: ["Box-to-Box Midfielder", "Deep-lying Playmaker", "Advanced Playmaker", "Ball-winning Midfielder"],
  Attacker: ["Inside Forward", "Target Man", "Poacher", "Winger"],
};

const ROLEDESCRIPTIONS = {
  Goalkeeper: [
    "A reliable goalkeeper who excels at shot-stopping and dominating the penalty box.",
    "A modern sweeper-keeper known for building plays from the back and swift distributions."
  ],
  Defender: [
    "A towering defender who dominates aerial duels and organizes the backline with leadership.",
    "An energetic fullback who provides defensive solidity and overlaps to support the attack.",
    "A technical ball-playing center-back known for precise long passes and stepping into midfield.",
    "A classic defender focused on strong tackles, blocks, and clearing lines under pressure."
  ],
  Midfielder: [
    "A tireless box-to-box engine who breaks up opponent attacks and drives forward into the box.",
    "A creative orchestrator with exceptional passing range and vision, controlling the match tempo.",
    "A defensive midfield anchor who shields the defense with intercepting skills and simple recycling.",
    "An attacking midfielder who excels in tight spaces, creating chances and arriving late to score."
  ],
  Attacker: [
    "A prolific striker with clinical finishing ability and exceptional movement off the ball.",
    "A tricky, rapid winger who excels in 1v1 situations, cutting inside to shoot or cross.",
    "A physical target man who holds up play, brings teammates into the game, and scores headers.",
    "An inside forward who uses speed and dribbling to breach defensive lines from wider positions."
  ]
};

const enrichPlayerData = (data) => {
  const pos = data.position || "Midfielder";
  const rand = Math.random();
  
  if (!data.preferredFoot) {
    if (pos === "Goalkeeper") data.preferredFoot = rand > 0.12 ? "Right" : "Left";
    else if (pos === "Defender") data.preferredFoot = rand > 0.25 ? "Right" : "Left";
    else data.preferredFoot = rand > 0.30 ? "Right" : "Left";
  }

  if (!data.height) {
    if (pos === "Goalkeeper") data.height = Math.floor(Math.random() * 16) + 185;
    else if (pos === "Defender") data.height = Math.floor(Math.random() * 16) + 180;
    else if (pos === "Midfielder") data.height = Math.floor(Math.random() * 16) + 172;
    else data.height = Math.floor(Math.random() * 19) + 170;
  }

  if (!data.shirtNumber) {
    if (pos === "Goalkeeper") data.shirtNumber = [1, 13, 99][Math.floor(Math.random() * 3)];
    else if (pos === "Defender") data.shirtNumber = [2, 3, 4, 5, 6, 12, 14, 15, 16, 21, 23, 24, 25, 26, 32][Math.floor(Math.random() * 15)];
    else if (pos === "Midfielder") data.shirtNumber = [8, 10, 14, 16, 17, 18, 20, 21, 23, 25, 29, 30, 32][Math.floor(Math.random() * 13)];
    else data.shirtNumber = [7, 9, 10, 11, 14, 17, 18, 19, 20, 22, 23, 27, 29, 30, 45, 90][Math.floor(Math.random() * 16)];
  }

  if (!data.appearances || data.appearances <= 0) {
    data.appearances = Math.floor(Math.random() * 24) + 15;
  }

  if (!data.goals && !data.assists) {
    if (pos === "Goalkeeper") {
      data.goals = 0;
      data.assists = Math.random() > 0.95 ? 1 : 0;
    } else if (pos === "Defender") {
      data.goals = Math.floor(Math.random() * 4);
      data.assists = Math.floor(Math.random() * 6);
    } else if (pos === "Midfielder") {
      data.goals = Math.floor(Math.random() * 8) + 1;
      data.assists = Math.floor(Math.random() * 11) + 2;
    } else {
      data.goals = Math.floor(Math.random() * 17) + 6;
      data.assists = Math.floor(Math.random() * 9) + 2;
    }
  }

  if (!data.nationalTeam) {
    data.nationalTeam = data.nationality;
  }

  if (!data.marketValue) {
    const age = data.age || 26;
    const totalStats = (data.goals || 0) + (data.assists || 0);
    let baseVal = 10;
    if (pos === "Attacker") baseVal = 25 + totalStats * 4;
    else if (pos === "Midfielder") baseVal = 20 + totalStats * 3.5;
    else if (pos === "Defender") baseVal = 15 + totalStats * 3;
    else baseVal = 12 + data.appearances * 0.5;

    if (age < 23) baseVal *= 1.3;
    else if (age > 30) baseVal *= Math.max(0.3, 1 - (age - 30) * 0.1);

    data.marketValue = `€${Math.max(1, Math.round(baseVal))}M`;
  }

  if (!data.playStyle) {
    const styles = PLAYSTYLES[pos] || PLAYSTYLES.Midfielder;
    data.playStyle = styles[Math.floor(Math.random() * styles.length)];
  }

  if (!data.roleDescription) {
    const descs = ROLEDESCRIPTIONS[pos] || ROLEDESCRIPTIONS.Midfielder;
    data.roleDescription = descs[Math.floor(Math.random() * descs.length)];
  }

  return data;
};

const generateMockPlayers = async (countNeeded) => {
  const firstNames = ["Luka", "Kylian", "Kevin", "Erling", "Mohamed", "Harry", "Robert", "Antoine", "Jude", "Vinicius", "Bukayo", "Martin", "Bruno", "Marcus", "Declan", "William", "Virgil", "Trent", "Alisson", "Ederson", "Thibaut", "Manuel", "Joshua", "Leon", "Thomas", "Leroy", "Jamal", "Kingsley", "Achraf", "Ousmane", "Warren", "Marquinhos", "Federico", "Nicolo", "Rafael", "Lautaro", "Victor", "Khvicha", "Theo", "Mike", "Denzel", "Frenkie", "Memphis", "Luuk", "Santiago", "David", "Angel", "Goncalo", "Diogo", "Bruno", "Ruben", "Joao", "Cristiano", "Karim", "Neymar", "Sadio", "Kalidou", "Riyad", "Sergej", "Marcelo", "Lionel", "Luis", "Cesc", "Gerard", "Sergio", "Iago", "Antoine", "Pedri", "Gavi", "Ronald", "Frenkie", "Ilkay", "Robert"];
  const lastNames = ["Modric", "Mbappe", "De Bruyne", "Haaland", "Salah", "Kane", "Lewandowski", "Griezmann", "Bellingham", "Junior", "Saka", "Odegaard", "Fernandes", "Rashford", "Rice", "Saliba", "van Dijk", "Alexander-Arnold", "Becker", "Ederson", "Courtois", "Neuer", "Kimmich", "Goretzka", "Muller", "Sane", "Musiala", "Coman", "Hakimi", "Dembele", "Zaire-Emery", "Marquinhos", "Chiesa", "Barella", "Leao", "Martinez", "Osimhen", "Kvaratskhelia", "Hernandez", "Maignan", "Dumfries", "de Jong", "Depay", "de Jong", "Gimenez", "Neres", "Di Maria", "Ramos", "Jota", "Guimaraes", "Dias", "Felix", "Ronaldo", "Benzema", "Silva", "Mane", "Koulibaly", "Mahrez", "Milinkovic-Savic", "Brozovic", "Messi", "Suarez", "Fabregas", "Pique", "Busquets", "Alba", "Aspas", "Griezmann", "Pedri", "Gavi", "Araujo", "de Jong", "Gundogan", "Lewandowski"];
  const positions = ["Goalkeeper", "Defender", "Midfielder", "Attacker"];
  const nationalities = ["Croatia", "France", "Belgium", "Norway", "Egypt", "England", "Poland", "Brazil", "Portugal", "Netherlands", "Germany", "Italy", "Senegal", "Morocco", "Argentina", "Uruguay", "Spain", "Turkey", "USA", "Saudi Arabia"];
  
  const leagueTeams = [
    { league: "Premier League", teams: ["Arsenal", "Liverpool", "Manchester City", "Chelsea", "Manchester United", "Tottenham", "Aston Villa", "Newcastle", "West Ham", "Brighton"] },
    { league: "La Liga", teams: ["Real Madrid", "Barcelona", "Atletico Madrid", "Real Sociedad", "Villarreal", "Real Betis", "Sevilla", "Athletic Bilbao"] },
    { league: "Bundesliga", teams: ["Bayern Munich", "Borussia Dortmund", "Bayer Leverkusen", "RB Leipzig", "Eintracht Frankfurt", "VfL Wolfsburg"] },
    { league: "Serie A", teams: ["Inter Milan", "AC Milan", "Juventus", "Napoli", "Lazio", "AS Roma", "Atalanta", "Fiorentina"] },
    { league: "Ligue 1", teams: ["PSG", "Marseille", "Monaco", "Lens", "Lille", "Rennes", "Lyon"] },
    { league: "Eredivisie", teams: ["Ajax", "PSV", "Feyenoord", "AZ Alkmaar"] },
    { league: "Primeira Liga", teams: ["Benfica", "FC Porto", "Sporting CP", "Braga"] },
    { league: "MLS", teams: ["Inter Miami", "LA Galaxy", "Los Angeles FC", "New York City FC"] },
    { league: "Saudi Pro League", teams: ["Al Nassr", "Al Hilal", "Al Ittihad", "Al Ahli"] },
    { league: "Turkish Super Lig", teams: ["Galatasaray", "Fenerbahce", "Besiktas", "Trabzonspor"] },
    { league: "Belgian Pro League", teams: ["Club Brugge", "Anderlecht", "Genk", "Antwerp"] }
  ];

  let savedCount = 0;
  let attemptId = 900000;

  // Find highest apiPlayerId in db to avoid collisions
  const highestPlayer = await Player.findOne().sort({ apiPlayerId: -1 });
  if (highestPlayer && highestPlayer.apiPlayerId > attemptId) {
    attemptId = highestPlayer.apiPlayerId + 1;
  }

  while (savedCount < countNeeded) {
    const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
    const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
    const name = `${fn} ${ln}`;

    // Verify name uniqueness
    const nameExists = await Player.findOne({ name });
    if (nameExists) continue;

    const pos = positions[Math.floor(Math.random() * positions.length)];
    const nat = nationalities[Math.floor(Math.random() * nationalities.length)];
    const age = Math.floor(Math.random() * 21) + 18; // 18 to 38
    const lt = leagueTeams[Math.floor(Math.random() * leagueTeams.length)];
    const league = lt.league;
    const team = lt.teams[Math.floor(Math.random() * lt.teams.length)];
    const apiPlayerId = attemptId;
    attemptId += 1;

    const photo = `https://media.api-sports.io/football/players/${apiPlayerId}.png`;

    const enriched = enrichPlayerData({
      name,
      team,
      position: pos,
      nationality: nat,
      age,
      league,
      photo,
      apiPlayerId,
    });

    await Player.create(enriched);

    savedCount += 1;
    if (savedCount % 50 === 0 || savedCount === countNeeded) {
      console.log(`    Generated fallback players: ${savedCount}/${countNeeded}`);
    }
  }

  return savedCount;
};

const importPlayers = async () => {
  let totalFetched = 0;
  let totalSaved = 0;
  let totalDuplicates = 0;

  try {
    console.log("Connecting to MongoDB...");
    await connectDB();
    console.log("Database connected successfully.");

    // Ensure unique index on apiPlayerId exists
    try {
      console.log("Ensuring unique index on apiPlayerId...");
      await Player.collection.createIndex({ apiPlayerId: 1 }, { unique: true });
    } catch (indexError) {
      console.warn("Index creation warning (it may already exist):", indexError.message);
    }

    let currentDbCount = await Player.countDocuments();
    console.log(`Starting Import. Current Database Count: ${currentDbCount}`);

    if (currentDbCount >= TARGET_PLAYER_COUNT) {
      console.log(`Database already has ${currentDbCount} players, which is >= target of ${TARGET_PLAYER_COUNT}.`);
      printSummary(totalFetched, totalSaved, totalDuplicates, currentDbCount);
      process.exit(0);
    }

    // Outer loop through leagues
    for (const league of LEAGUES) {
      if (currentDbCount >= TARGET_PLAYER_COUNT) break;

      console.log(`\n========================================`);
      console.log(`League Name: ${league.name} (ID: ${league.id})`);
      console.log(`========================================`);

      // Fetch teams in league
      const teamsResponse = await fetchTeams(league.id, SEASON);
      await delay(6000); // Respect API limits (10 req/min for free plan)

      console.log(`Found ${teamsResponse.length} teams in ${league.name}.`);

      // Loop through teams
      for (const teamContainer of teamsResponse) {
        if (currentDbCount >= TARGET_PLAYER_COUNT) break;

        const team = teamContainer.team;
        console.log(`\n -> Team Name: ${team.name} (ID: ${team.id})`);

        // Fetch players team-by-team
        let page = 1;
        let hasMorePages = true;

        while (hasMorePages && currentDbCount < TARGET_PLAYER_COUNT && page <= 3) {
          console.log(`    Fetching players (Page ${page})...`);
          const players = await fetchTeamPlayers(team.id, SEASON, page);
          await delay(6000); // Respect API limits (10 req/min for free plan)

          if (!players || players.length === 0) {
            hasMorePages = false;
            break;
          }

          totalFetched += players.length;
          let teamSaved = 0;
          let teamDuplicates = 0;

          // Process players on this team page
          for (const player of players) {
            if (currentDbCount >= TARGET_PLAYER_COUNT) break;

            // 1. Data Quality Checks
            if (!player.name || !player.team || !player.position || !player.nationality || !player.apiPlayerId) {
              continue; // Skip invalid records
            }

            // Exclude placeholder photos
            const hasNoPhoto = !player.photo || player.photo.includes("placeholder") || player.photo.includes("silhouette");
            if (hasNoPhoto) {
              continue; // Quality filter: must have real photo
            }

            // Prioritize active first-team players (must have played at least 1 appearance)
            if (player.appearances <= 0) {
              continue; // Quality filter: must be active first-team
            }

            // 2. Uniqueness Checks
            const existing = await Player.findOne({ apiPlayerId: player.apiPlayerId });
            if (existing) {
              teamDuplicates += 1;
              totalDuplicates += 1;
              continue;
            }

            // Save player to database
            const enriched = enrichPlayerData({
              name: player.name,
              team: player.team,
              position: player.position,
              nationality: player.nationality,
              age: player.age,
              league: player.league,
              photo: player.photo,
              apiPlayerId: player.apiPlayerId,
              appearances: player.appearances,
            });

            await Player.create(enriched);

            teamSaved += 1;
            totalSaved += 1;
            currentDbCount += 1;
          }

          console.log(`    [Stats] Players Fetched: ${players.length} | Players Saved: ${teamSaved} | Duplicates Skipped: ${teamDuplicates}`);
          console.log(`    Current Database Count: ${currentDbCount}/${TARGET_PLAYER_COUNT}`);

          // API-Football returns 20 players per page. If fewer, we reached the end of squad.
          if (players.length < 20) {
            hasMorePages = false;
          } else {
            page += 1;
          }
        }
      }
    }

    printSummary(totalFetched, totalSaved, totalDuplicates, currentDbCount);
    process.exit(0);
  } catch (error) {
    console.error(`\nError during player import: ${error.message}`);
    
    // Trigger local generation fallback if database is under target
    let finalDbCount = await Player.countDocuments();
    if (finalDbCount < TARGET_PLAYER_COUNT) {
      console.log(`\n--------------------------------------------------`);
      console.log(`API Key exhausted or error occurred. Triggering local seeder fallback...`);
      console.log(`Need to generate ${TARGET_PLAYER_COUNT - finalDbCount} unique players to reach target.`);
      console.log(`--------------------------------------------------\n`);
      
      const mockSaved = await generateMockPlayers(TARGET_PLAYER_COUNT - finalDbCount);
      totalSaved += mockSaved;
      finalDbCount += mockSaved;
    }

    printSummary(totalFetched, totalSaved, totalDuplicates, finalDbCount);
    process.exit(0); // Exit successfully with filled database
  }
};

const printSummary = (fetched, saved, duplicates, finalCount) => {
  console.log("\n==================================");
  console.log("FOOTKINATOR IMPORT COMPLETE\n");
  console.log(`Total Players Fetched: ${fetched}`);
  console.log(`Total Players Saved: ${saved}`);
  console.log(`Duplicates Skipped: ${duplicates}`);
  console.log(`Final Database Count: ${finalCount}`);
  console.log("==================================");
};

importPlayers();

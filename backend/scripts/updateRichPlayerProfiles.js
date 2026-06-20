const dotenv = require("dotenv");
const path = require("path");
const connectDB = require("../config/db");
const Player = require("../models/Player");

// Load env variables
dotenv.config({ path: path.join(__dirname, "../.env") });

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

const updatePlayers = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await connectDB();
    console.log("Connected successfully.");

    const players = await Player.find();
    console.log(`Found ${players.length} players to update.`);

    let updatedCount = 0;

    for (const player of players) {
      const pos = player.position || "Midfielder";
      
      // 1. Preferred foot
      let preferredFoot = player.preferredFoot;
      if (!preferredFoot) {
        const rand = Math.random();
        if (pos === "Goalkeeper") {
          preferredFoot = rand > 0.12 ? "Right" : "Left";
        } else if (pos === "Defender") {
          preferredFoot = rand > 0.25 ? "Right" : "Left";
        } else {
          preferredFoot = rand > 0.30 ? "Right" : "Left";
        }
      }

      // 2. Height
      let height = player.height;
      if (!height) {
        if (pos === "Goalkeeper") {
          height = Math.floor(Math.random() * 16) + 185; // 185-200
        } else if (pos === "Defender") {
          height = Math.floor(Math.random() * 16) + 180; // 180-195
        } else if (pos === "Midfielder") {
          height = Math.floor(Math.random() * 16) + 172; // 172-187
        } else {
          height = Math.floor(Math.random() * 19) + 170; // 170-188
        }
      }

      // 3. Shirt Number
      let shirtNumber = player.shirtNumber;
      if (!shirtNumber) {
        if (pos === "Goalkeeper") {
          shirtNumber = [1, 13, 99][Math.floor(Math.random() * 3)];
        } else if (pos === "Defender") {
          shirtNumber = [2, 3, 4, 5, 6, 12, 14, 15, 16, 21, 23, 24, 25, 26, 32][Math.floor(Math.random() * 15)];
        } else if (pos === "Midfielder") {
          shirtNumber = [8, 10, 14, 16, 17, 18, 20, 21, 23, 25, 29, 30, 32][Math.floor(Math.random() * 13)];
        } else {
          shirtNumber = [7, 9, 10, 11, 14, 17, 18, 19, 20, 22, 23, 27, 29, 30, 45, 90][Math.floor(Math.random() * 16)];
        }
      }

      // 4. Appearances
      let appearances = player.appearances || 0;
      if (appearances <= 0) {
        appearances = Math.floor(Math.random() * 24) + 15; // 15-38
      }

      // 5. Goals & Assists
      let goals = player.goals || 0;
      let assists = player.assists || 0;
      if (goals === 0 && assists === 0) {
        if (pos === "Goalkeeper") {
          goals = 0;
          assists = Math.random() > 0.95 ? 1 : 0;
        } else if (pos === "Defender") {
          goals = Math.floor(Math.random() * 4); // 0-3
          assists = Math.floor(Math.random() * 6); // 0-5
        } else if (pos === "Midfielder") {
          goals = Math.floor(Math.random() * 8) + 1; // 1-8
          assists = Math.floor(Math.random() * 11) + 2; // 2-12
        } else {
          goals = Math.floor(Math.random() * 17) + 6; // 6-22
          assists = Math.floor(Math.random() * 9) + 2; // 2-10
        }
      }

      // 6. National Team
      let nationalTeam = player.nationalTeam;
      if (!nationalTeam) {
        nationalTeam = player.nationality;
      }

      // 7. Market Value
      let marketValue = player.marketValue;
      if (!marketValue) {
        // Calculate dynamic market value based on position, age, and stats
        const age = player.age || 26;
        const totalStats = goals + assists;
        let baseVal = 10; // Millions

        if (pos === "Attacker") baseVal = 25 + totalStats * 4;
        else if (pos === "Midfielder") baseVal = 20 + totalStats * 3.5;
        else if (pos === "Defender") baseVal = 15 + totalStats * 3;
        else baseVal = 12 + appearances * 0.5;

        // Age factor
        if (age < 23) baseVal *= 1.3; // Young talent premium
        else if (age > 30) baseVal *= Math.max(0.3, 1 - (age - 30) * 0.1); // Age decay

        const finalMillions = Math.max(1, Math.round(baseVal));
        marketValue = `€${finalMillions}M`;
      }

      // 8. Playstyle
      let playStyle = player.playStyle;
      if (!playStyle) {
        const styles = PLAYSTYLES[pos] || PLAYSTYLES.Midfielder;
        playStyle = styles[Math.floor(Math.random() * styles.length)];
      }

      // 9. Role Description
      let roleDescription = player.roleDescription;
      if (!roleDescription) {
        const descOptions = ROLEDESCRIPTIONS[pos] || ROLEDESCRIPTIONS.Midfielder;
        roleDescription = descOptions[Math.floor(Math.random() * descOptions.length)];
      }

      // Apply modifications
      player.preferredFoot = preferredFoot;
      player.height = height;
      player.shirtNumber = shirtNumber;
      player.goals = goals;
      player.assists = assists;
      player.appearances = appearances;
      player.nationalTeam = nationalTeam;
      player.marketValue = marketValue;
      player.playStyle = playStyle;
      player.roleDescription = roleDescription;

      await player.save();
      updatedCount += 1;
    }

    console.log(`Successfully updated ${updatedCount} player profiles with rich attributes!`);
    process.exit(0);
  } catch (error) {
    console.error("Error migrating players:", error);
    process.exit(1);
  }
};

updatePlayers();

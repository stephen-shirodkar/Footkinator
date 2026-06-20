const dotenv = require("dotenv");
const path = require("path");
const connectDB = require("../config/db");
const Player = require("../models/Player");

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

const KNOWN_STAR_PLAYERS = {
  "Cristiano Ronaldo": { apiPlayerId: 874, photo: "https://media.api-sports.io/football/players/874.png" },
  "Lionel Messi": { apiPlayerId: 154, photo: "https://media.api-sports.io/football/players/154.png" },
  "Erling Haaland": { apiPlayerId: 1100, photo: "https://media.api-sports.io/football/players/1100.png" },
  "Kylian Mbappé": { apiPlayerId: 276, photo: "https://media.api-sports.io/football/players/276.png" },
  "Kylian Mbappe": { apiPlayerId: 276, photo: "https://media.api-sports.io/football/players/276.png" },
  "Jude Bellingham": { apiPlayerId: 1359, photo: "https://media.api-sports.io/football/players/1359.png" },
  "Vinícius Júnior": { apiPlayerId: 647, photo: "https://media.api-sports.io/football/players/647.png" },
  "Mohamed Salah": { apiPlayerId: 306, photo: "https://media.api-sports.io/football/players/306.png" },
  "Lamine Yamal": { apiPlayerId: 347466, photo: "https://media.api-sports.io/football/players/347466.png" },
  "Harry Kane": { apiPlayerId: 184, photo: "https://media.api-sports.io/football/players/184.png" },
  "Rodri": { apiPlayerId: 18956, photo: "https://media.api-sports.io/football/players/18956.png" },
  "Pedri": { apiPlayerId: 30424, photo: "https://media.api-sports.io/football/players/30424.png" },
  "Jamal Musiala": { apiPlayerId: 147820, photo: "https://media.api-sports.io/football/players/147820.png" },
  "Cole Palmer": { apiPlayerId: 284307, photo: "https://media.api-sports.io/football/players/284307.png" },
  "Bukayo Saka": { apiPlayerId: 1457, photo: "https://media.api-sports.io/football/players/1457.png" },
  "Kevin De Bruyne": { apiPlayerId: 629, photo: "https://media.api-sports.io/football/players/629.png" },
  "Virgil van Dijk": { apiPlayerId: 290, photo: "https://media.api-sports.io/football/players/290.png" },
  "Luka Modrić": { apiPlayerId: 750, photo: "https://media.api-sports.io/football/players/750.png" },
  "Robert Lewandowski": { apiPlayerId: 521, photo: "https://media.api-sports.io/football/players/521.png" },
  "Lautaro Martínez": { apiPlayerId: 907, photo: "https://media.api-sports.io/football/players/907.png" },
  "Rafael Leão": { apiPlayerId: 22165, photo: "https://media.api-sports.io/football/players/22165.png" },
  "Neymar Jr": { apiPlayerId: 274, photo: "https://media.api-sports.io/football/players/274.png" }
};

const validatePlayers = async () => {
  try {
    console.log("Connecting to database...");
    await connectDB();
    console.log("Database connected successfully.");

    const players = await Player.find();
    console.log(`Auditing ${players.length} players...\n`);

    let missingPhotosCount = 0;
    let invalidUrlsCount = 0;
    let mismatchesCount = 0;
    let duplicatesIdCount = 0;
    let duplicatesNameCount = 0;
    let autoHealedCount = 0;
    let deletedCount = 0;

    const seenIds = new Set();
    const seenNames = new Set();

    for (const player of players) {
      let { _id, name, apiPlayerId, photo } = player;

      // 1. Auto-heal missing apiPlayerId using photo URL if possible
      if (!apiPlayerId && photo) {
        const photoMatch = photo.match(/players\/(\d+)\.png/);
        if (photoMatch) {
          const extractedId = parseInt(photoMatch[1], 10);
          
          // Collision check: does another player already have this ID?
          const existingWithId = await Player.findOne({ apiPlayerId: extractedId });
          if (existingWithId) {
            console.log(` -> Collision detected! ID ${extractedId} already belongs to "${existingWithId.name}". Deleting the current corrupt player "${name}"...`);
            await Player.deleteOne({ _id });
            deletedCount++;
            continue;
          }

          console.log(` -> Auto-healing missing ID for "${name}" using photo URL ID (${extractedId})...`);
          player.apiPlayerId = extractedId;
          await player.save();
          apiPlayerId = extractedId;
          autoHealedCount++;
        }
      }

      // 2. Check Missing properties
      if (!name || !apiPlayerId || !photo) {
        console.error(`[CRITICAL] Missing properties for Player: Name: "${name}", ID: ${apiPlayerId}, Photo: "${photo}"`);
        missingPhotosCount++;
        // Delete if completely corrupt
        console.log(` -> Deleting corrupt player record: "${name}"...`);
        await Player.deleteOne({ _id });
        deletedCount++;
        continue;
      }

      // 3. Check duplicate apiPlayerId
      if (seenIds.has(apiPlayerId)) {
        console.log(` -> Deleting duplicate player by ID: "${name}" (ID: ${apiPlayerId})...`);
        await Player.deleteOne({ _id });
        duplicatesIdCount++;
        deletedCount++;
        continue;
      } else {
        seenIds.add(apiPlayerId);
      }

      // 4. Check duplicate names
      const normalizedName = name.trim().toLowerCase();
      if (seenNames.has(normalizedName)) {
        console.log(` -> Deleting duplicate player by Name: "${name}" (ID: ${apiPlayerId})...`);
        await Player.deleteOne({ _id });
        duplicatesNameCount++;
        deletedCount++;
        continue;
      } else {
        seenNames.add(normalizedName);
      }

      // 5. Check valid photo URL format
      const photoMatch = photo.match(/players\/(\d+)\.png/);
      if (!photoMatch) {
        console.warn(`[WARNING] Invalid photo URL format for Player: "${name}" | Photo: "${photo}"`);
        invalidUrlsCount++;
        continue;
      }

      // 6. Check name/photo/ID mismatches
      const photoId = parseInt(photoMatch[1], 10);
      let hasMismatch = false;
      let reason = "";

      if (photoId !== apiPlayerId) {
        hasMismatch = true;
        reason = `Photo ID (${photoId}) does not match apiPlayerId (${apiPlayerId})`;
      }

      // Check against known star players (Exact Match only to avoid mock matches like "Neymar Fernandes")
      const knownStar = KNOWN_STAR_PLAYERS[name];

      if (knownStar) {
        if (apiPlayerId !== knownStar.apiPlayerId || photo !== knownStar.photo) {
          hasMismatch = true;
          reason = `Star player "${name}" has ID ${apiPlayerId} (expected ${knownStar.apiPlayerId}) and Photo "${photo}" (expected "${knownStar.photo}")`;
        }
      }

      if (hasMismatch) {
        console.error(`[MISMATCH] Player: "${name}" | Reason: ${reason}`);
        
        // Auto-Healing Mismatch
        if (knownStar) {
          // Check collision before save
          const existingWithId = await Player.findOne({ apiPlayerId: knownStar.apiPlayerId });
          if (existingWithId && String(existingWithId._id) !== String(_id)) {
            console.log(` -> Collision! Star player ID ${knownStar.apiPlayerId} belongs to "${existingWithId.name}". Deleting conflicting record...`);
            await Player.deleteOne({ _id: existingWithId._id });
            deletedCount++;
          }
          
          console.log(` -> Auto-healing star player: "${name}"...`);
          player.apiPlayerId = knownStar.apiPlayerId;
          player.photo = knownStar.photo;
          await player.save();
          mismatchesCount++;
          autoHealedCount++;
          console.log(` ✓ Star player "${name}" auto-healed.`);
        } else {
          // If non-star player, align photo URL to their apiPlayerId
          console.log(` -> Auto-healing photo URL to match apiPlayerId (${apiPlayerId}) for "${name}"...`);
          player.photo = `https://media.api-sports.io/football/players/${apiPlayerId}.png`;
          await player.save();
          mismatchesCount++;
          autoHealedCount++;
          console.log(` ✓ Photo URL auto-healed for "${name}".`);
        }
      }
    }

    // Print Validation Summary Report
    console.log(`\n========================================`);
    console.log(`      PLAYER DATA VALIDATION REPORT      `);
    console.log(`========================================`);
    console.log(`Total Players Audited:       ${players.length}`);
    console.log(`Deleted Corrupt/Duplicate:   ${deletedCount}`);
    console.log(`Missing properties:          ${missingPhotosCount}`);
    console.log(`Invalid photo URL formats:   ${invalidUrlsCount}`);
    console.log(`Duplicate apiPlayerIds:      ${duplicatesIdCount}`);
    console.log(`Duplicate player names:      ${duplicatesNameCount}`);
    console.log(`Name/Photo/ID Mismatches:    ${mismatchesCount}`);
    console.log(`Auto-Healed Records:         ${autoHealedCount}`);
    console.log(`========================================`);

    if (mismatchesCount === 0 && duplicatesIdCount === 0 && duplicatesNameCount === 0 && missingPhotosCount === 0) {
      console.log(`STATUS: SUCCESS (All data is correct and integer-consistent)`);
    } else if (mismatchesCount === autoHealedCount) {
      console.log(`STATUS: AUTO-HEALED (All mismatches were successfully fixed)`);
    } else {
      console.log(`STATUS: WARNING (Manually check validation output above)`);
    }
    console.log(`========================================\n`);

    process.exit(0);
  } catch (error) {
    console.error("Error during player validation:", error.message);
    process.exit(1);
  }
};

validatePlayers();

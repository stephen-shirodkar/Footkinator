const dotenv = require("dotenv");
const path = require("path");
const axios = require("axios");
const connectDB = require("../config/db");
const Player = require("../models/Player");

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

const API_FOOTBALL_BASE_URL = "https://v3.football.api-sports.io";

// Curated list of 240+ famous players (real stars with real IDs)
const starPlayers = [
  // --- REAL MADRID ---
  { apiPlayerId: 874, name: "Cristiano Ronaldo", team: "Al Nassr", league: "Saudi Pro League", nationality: "Portugal", age: 39, position: "Attacker", photo: "https://media.api-sports.io/football/players/874.png", preferredFoot: "Right", height: 187, shirtNumber: 7, goals: 35, assists: 11, appearances: 31, playStyle: "Inside Forward", roleDescription: "A legendary forward known for goalscoring and clutch performances." },
  { apiPlayerId: 154, name: "Lionel Messi", team: "Inter Miami", league: "MLS", nationality: "Argentina", age: 36, position: "Attacker", photo: "https://media.api-sports.io/football/players/154.png", preferredFoot: "Left", height: 170, shirtNumber: 10, goals: 23, assists: 15, appearances: 29, playStyle: "Winger", roleDescription: "Widely regarded as the greatest player ever, a legendary dribbler and playmaker." },
  { apiPlayerId: 276, name: "Kylian Mbappé", team: "Real Madrid", league: "La Liga", nationality: "France", age: 25, position: "Attacker", photo: "https://media.api-sports.io/football/players/276.png", preferredFoot: "Right", height: 178, shirtNumber: 9, goals: 27, assists: 7, appearances: 29, playStyle: "Winger", roleDescription: "A blistering fast forward with elite finishing who cuts inside from the left." },
  { apiPlayerId: 1100, name: "Erling Haaland", team: "Manchester City", league: "Premier League", nationality: "Norway", age: 23, position: "Attacker", photo: "https://media.api-sports.io/football/players/1100.png", preferredFoot: "Left", height: 194, shirtNumber: 9, goals: 27, assists: 5, appearances: 31, playStyle: "Poacher", roleDescription: "A clinical, tall striker who excels at finishing inside the box." },
  { apiPlayerId: 1359, name: "Jude Bellingham", team: "Real Madrid", league: "La Liga", nationality: "England", age: 20, position: "Midfielder", photo: "https://media.api-sports.io/football/players/1359.png", preferredFoot: "Right", height: 186, shirtNumber: 5, goals: 19, assists: 6, appearances: 28, playStyle: "Box-to-Box Midfielder", roleDescription: "A mature young midfielder who scores late runs into the box." },
  { apiPlayerId: 647, name: "Vinícius Júnior", team: "Real Madrid", league: "La Liga", nationality: "Brazil", age: 23, position: "Attacker", photo: "https://media.api-sports.io/football/players/647.png", preferredFoot: "Right", height: 176, shirtNumber: 7, goals: 15, assists: 5, appearances: 26, playStyle: "Winger", roleDescription: "A tricky winger with explosive acceleration and lethal 1v1 dribbling." },
  { apiPlayerId: 306, name: "Mohamed Salah", team: "Liverpool", league: "Premier League", nationality: "Egypt", age: 32, position: "Attacker", photo: "https://media.api-sports.io/football/players/306.png", preferredFoot: "Left", height: 175, shirtNumber: 11, goals: 18, assists: 10, appearances: 32, playStyle: "Inside Forward", roleDescription: "A prolific, rapid wide forward known for clinical finishing from the right wing." },
  { apiPlayerId: 347466, name: "Lamine Yamal", team: "Barcelona", league: "La Liga", nationality: "Spain", age: 16, position: "Attacker", photo: "https://media.api-sports.io/football/players/347466.png", preferredFoot: "Left", height: 178, shirtNumber: 19, goals: 5, assists: 6, appearances: 35, playStyle: "Winger", roleDescription: "A generational young winger with world-class dribbling and decision making." },
  { apiPlayerId: 184, name: "Harry Kane", team: "Bayern Munich", league: "Bundesliga", nationality: "England", age: 30, position: "Attacker", photo: "https://media.api-sports.io/football/players/184.png", preferredFoot: "Right", height: 188, shirtNumber: 9, goals: 36, assists: 8, appearances: 32, playStyle: "Target Man", roleDescription: "A complete forward combining elite goalscoring and deep drop-in playmaking." },
  { apiPlayerId: 18956, name: "Rodri", team: "Manchester City", league: "Premier League", nationality: "Spain", age: 27, position: "Midfielder", photo: "https://media.api-sports.io/football/players/18956.png", preferredFoot: "Right", height: 191, shirtNumber: 16, goals: 8, assists: 9, appearances: 34, playStyle: "Deep-lying Playmaker", roleDescription: "A complete defensive midfielder who dictates play and orchestrates build-ups." },
  { apiPlayerId: 30424, name: "Pedri", team: "Barcelona", league: "La Liga", nationality: "Spain", age: 21, position: "Midfielder", photo: "https://media.api-sports.io/football/players/30424.png", preferredFoot: "Right", height: 174, shirtNumber: 8, goals: 4, assists: 2, appearances: 24, playStyle: "Advanced Playmaker", roleDescription: "A creative midfielder known for tight control, vision, and body turns." },
  { apiPlayerId: 147820, name: "Jamal Musiala", team: "Bayern Munich", league: "Bundesliga", nationality: "Germany", age: 21, position: "Midfielder", photo: "https://media.api-sports.io/football/players/147820.png", preferredFoot: "Right", height: 184, shirtNumber: 42, goals: 10, assists: 6, appearances: 24, playStyle: "Advanced Playmaker", roleDescription: "An agile midfielder with snake-like dribbling in tight boxes." },
  { apiPlayerId: 284307, name: "Cole Palmer", team: "Chelsea", league: "Premier League", nationality: "England", age: 22, position: "Midfielder", photo: "https://media.api-sports.io/football/players/284307.png", preferredFoot: "Left", height: 189, shirtNumber: 20, goals: 22, assists: 11, appearances: 33, playStyle: "Advanced Playmaker", roleDescription: "An elegant attacker with cold composure and highly creative vision." },
  { apiPlayerId: 1457, name: "Bukayo Saka", team: "Arsenal", league: "Premier League", nationality: "England", age: 22, position: "Attacker", photo: "https://media.api-sports.io/football/players/1457.png", preferredFoot: "Left", height: 178, shirtNumber: 7, goals: 16, assists: 9, appearances: 35, playStyle: "Winger", roleDescription: "A creative right winger who excels at 1v1 duels and combines well with overlays." },
  { apiPlayerId: 629, name: "Kevin De Bruyne", team: "Manchester City", league: "Premier League", nationality: "Belgium", age: 32, position: "Midfielder", photo: "https://media.api-sports.io/football/players/629.png", preferredFoot: "Right", height: 181, shirtNumber: 17, goals: 4, assists: 10, appearances: 18, playStyle: "Advanced Playmaker", roleDescription: "A world-class midfielder with exceptional crossing and passing vision." },
  { apiPlayerId: 290, name: "Virgil van Dijk", team: "Liverpool", league: "Premier League", nationality: "Netherlands", age: 32, position: "Defender", photo: "https://media.api-sports.io/football/players/290.png", preferredFoot: "Right", height: 195, shirtNumber: 4, goals: 2, assists: 2, appearances: 36, playStyle: "Ball-playing Defender", roleDescription: "A commanding center-back with outstanding aerial presence and leadership." },
  { apiPlayerId: 750, name: "Luka Modrić", team: "Real Madrid", league: "La Liga", nationality: "Croatia", age: 38, position: "Midfielder", photo: "https://media.api-sports.io/football/players/750.png", preferredFoot: "Right", height: 172, shirtNumber: 10, goals: 2, assists: 5, appearances: 32, playStyle: "Deep-lying Playmaker", roleDescription: "A Ballon d'Or winning midfielder with exceptional intelligence and outside-foot passes." },
  { apiPlayerId: 521, name: "Robert Lewandowski", team: "Barcelona", league: "La Liga", nationality: "Poland", age: 35, position: "Attacker", photo: "https://media.api-sports.io/football/players/521.png", preferredFoot: "Right", height: 185, shirtNumber: 9, goals: 19, assists: 8, appearances: 35, playStyle: "Poacher", roleDescription: "A legendary forward known for positioning, clinical scoring, and aerial threat." },
  { apiPlayerId: 907, name: "Lautaro Martínez", team: "Inter Milan", league: "Serie A", nationality: "Argentina", age: 26, position: "Attacker", photo: "https://media.api-sports.io/football/players/907.png", preferredFoot: "Right", height: 174, shirtNumber: 10, goals: 24, assists: 3, appearances: 33, playStyle: "Inside Forward", roleDescription: "A hard-working forward who captains Inter Milan and scores clinical volleys." },
  { apiPlayerId: 22165, name: "Rafael Leão", team: "AC Milan", league: "Serie A", nationality: "Portugal", age: 25, position: "Attacker", photo: "https://media.api-sports.io/football/players/22165.png", preferredFoot: "Right", height: 188, shirtNumber: 10, goals: 9, assists: 9, appearances: 34, playStyle: "Winger", roleDescription: "An explosive left winger with stride-based dribbling and flair." },
  
  // --- REAL MADRID EXTRA ---
  { apiPlayerId: 754, name: "Rodrygo", team: "Real Madrid", league: "La Liga", nationality: "Brazil", age: 23, position: "Attacker", photo: "https://media.api-sports.io/football/players/754.png", preferredFoot: "Right", height: 174, shirtNumber: 11 },
  { apiPlayerId: 747, name: "Federico Valverde", team: "Real Madrid", league: "La Liga", nationality: "Uruguay", age: 25, position: "Midfielder", photo: "https://media.api-sports.io/football/players/747.png", preferredFoot: "Right", height: 182, shirtNumber: 15 },
  { apiPlayerId: 154625, name: "Eduardo Camavinga", team: "Real Madrid", league: "La Liga", nationality: "France", age: 21, position: "Midfielder", photo: "https://media.api-sports.io/football/players/154625.png", preferredFoot: "Left", height: 182, shirtNumber: 12 },
  { apiPlayerId: 22227, name: "Aurélien Tchouaméni", team: "Real Madrid", league: "La Liga", nationality: "France", age: 24, position: "Midfielder", photo: "https://media.api-sports.io/football/players/22227.png", preferredFoot: "Right", height: 188, shirtNumber: 14 },
  { apiPlayerId: 735, name: "Thibaut Courtois", team: "Real Madrid", league: "La Liga", nationality: "Belgium", age: 32, position: "Goalkeeper", photo: "https://media.api-sports.io/football/players/735.png", preferredFoot: "Left", height: 200, shirtNumber: 1 },
  { apiPlayerId: 1043, name: "Éder Militão", team: "Real Madrid", league: "La Liga", nationality: "Brazil", age: 26, position: "Defender", photo: "https://media.api-sports.io/football/players/1043.png", preferredFoot: "Right", height: 186, shirtNumber: 3 },
  { apiPlayerId: 70, name: "Antonio Rüdiger", team: "Real Madrid", league: "La Liga", nationality: "Germany", age: 31, position: "Defender", photo: "https://media.api-sports.io/football/players/70.png", preferredFoot: "Right", height: 190, shirtNumber: 22 },
  { apiPlayerId: 732, name: "Dani Carvajal", team: "Real Madrid", league: "La Liga", nationality: "Spain", age: 32, position: "Defender", photo: "https://media.api-sports.io/football/players/732.png", preferredFoot: "Right", height: 173, shirtNumber: 2 },
  { apiPlayerId: 238202, name: "Arda Güler", team: "Real Madrid", league: "La Liga", nationality: "Turkey", age: 19, position: "Midfielder", photo: "https://media.api-sports.io/football/players/238202.png", preferredFoot: "Left", height: 176, shirtNumber: 21 },
  
  // --- BARCELONA EXTRA ---
  { apiPlayerId: 164627, name: "Gavi", team: "Barcelona", league: "La Liga", nationality: "Spain", age: 19, position: "Midfielder", photo: "https://media.api-sports.io/football/players/164627.png", preferredFoot: "Right", height: 173, shirtNumber: 6 },
  { apiPlayerId: 228, name: "Frenkie de Jong", team: "Barcelona", league: "La Liga", nationality: "Netherlands", age: 27, position: "Midfielder", photo: "https://media.api-sports.io/football/players/228.png", preferredFoot: "Right", height: 180, shirtNumber: 21 },
  { apiPlayerId: 2110, name: "Raphinha", team: "Barcelona", league: "La Liga", nationality: "Brazil", age: 27, position: "Attacker", photo: "https://media.api-sports.io/football/players/2110.png", preferredFoot: "Left", height: 176, shirtNumber: 11 },
  { apiPlayerId: 162125, name: "Ronald Araújo", team: "Barcelona", league: "La Liga", nationality: "Uruguay", age: 25, position: "Defender", photo: "https://media.api-sports.io/football/players/162125.png", preferredFoot: "Right", height: 188, shirtNumber: 4 },
  { apiPlayerId: 1161, name: "Marc-André ter Stegen", team: "Barcelona", league: "La Liga", nationality: "Germany", age: 32, position: "Goalkeeper", photo: "https://media.api-sports.io/football/players/1161.png", preferredFoot: "Right", height: 187, shirtNumber: 1 },
  { apiPlayerId: 635, name: "İlkay Gündoğan", team: "Barcelona", league: "La Liga", nationality: "Germany", age: 33, position: "Midfielder", photo: "https://media.api-sports.io/football/players/635.png", preferredFoot: "Right", height: 180, shirtNumber: 22 },
  { apiPlayerId: 2394, name: "João Félix", team: "Barcelona", league: "La Liga", nationality: "Portugal", age: 24, position: "Attacker", photo: "https://media.api-sports.io/football/players/2394.png", preferredFoot: "Right", height: 181, shirtNumber: 14 },
  { apiPlayerId: 22226, name: "Ferran Torres", team: "Barcelona", league: "La Liga", nationality: "Spain", age: 24, position: "Attacker", photo: "https://media.api-sports.io/football/players/22226.png", preferredFoot: "Right", height: 184, shirtNumber: 7 },
  { apiPlayerId: 161812, name: "Alejandro Balde", team: "Barcelona", league: "La Liga", nationality: "Spain", age: 20, position: "Defender", photo: "https://media.api-sports.io/football/players/161812.png", preferredFoot: "Left", height: 175, shirtNumber: 3 },
  { apiPlayerId: 2284, name: "Andreas Christensen", team: "Barcelona", league: "La Liga", nationality: "Denmark", age: 28, position: "Defender", photo: "https://media.api-sports.io/football/players/2284.png", preferredFoot: "Right", height: 188, shirtNumber: 15 },
  { apiPlayerId: 22237, name: "Jules Koundé", team: "Barcelona", league: "La Liga", nationality: "France", age: 25, position: "Defender", photo: "https://media.api-sports.io/football/players/22237.png", preferredFoot: "Right", height: 180, shirtNumber: 23 },
  { apiPlayerId: 18923, name: "Dani Olmo", team: "Barcelona", league: "La Liga", nationality: "Spain", age: 26, position: "Midfielder", photo: "https://media.api-sports.io/football/players/18923.png", preferredFoot: "Right", height: 179, shirtNumber: 20 },
  
  // --- MANCHESTER CITY EXTRA ---
  { apiPlayerId: 633, name: "Phil Foden", team: "Manchester City", league: "Premier League", nationality: "England", age: 24, position: "Midfielder", photo: "https://media.api-sports.io/football/players/633.png", preferredFoot: "Left", height: 171, shirtNumber: 47 },
  { apiPlayerId: 627, name: "Bernardo Silva", team: "Manchester City", league: "Premier League", nationality: "Portugal", age: 29, position: "Midfielder", photo: "https://media.api-sports.io/football/players/627.png", preferredFoot: "Left", height: 173, shirtNumber: 20 },
  { apiPlayerId: 631, name: "Jack Grealish", team: "Manchester City", league: "Premier League", nationality: "England", age: 28, position: "Midfielder", photo: "https://media.api-sports.io/football/players/631.png", preferredFoot: "Right", height: 175, shirtNumber: 10 },
  { apiPlayerId: 146313, name: "Jérémy Doku", team: "Manchester City", league: "Premier League", nationality: "Belgium", age: 22, position: "Attacker", photo: "https://media.api-sports.io/football/players/146313.png", preferredFoot: "Right", height: 171, shirtNumber: 11 },
  { apiPlayerId: 2096, name: "Julián Álvarez", team: "Manchester City", league: "Premier League", nationality: "Argentina", age: 24, position: "Attacker", photo: "https://media.api-sports.io/football/players/2096.png", preferredFoot: "Right", height: 170, shirtNumber: 19 },
  { apiPlayerId: 617, name: "Ederson Moraes", team: "Manchester City", league: "Premier League", nationality: "Brazil", age: 30, position: "Goalkeeper", photo: "https://media.api-sports.io/football/players/617.png", preferredFoot: "Left", height: 188, shirtNumber: 31 },
  { apiPlayerId: 621, name: "Rúben Dias", team: "Manchester City", league: "Premier League", nationality: "Portugal", age: 27, position: "Defender", photo: "https://media.api-sports.io/football/players/621.png", preferredFoot: "Right", height: 187, shirtNumber: 3 },
  { apiPlayerId: 623, name: "John Stones", team: "Manchester City", league: "Premier League", nationality: "England", age: 30, position: "Defender", photo: "https://media.api-sports.io/football/players/623.png", preferredFoot: "Right", height: 188, shirtNumber: 5 },
  { apiPlayerId: 619, name: "Kyle Walker", team: "Manchester City", league: "Premier League", nationality: "England", age: 34, position: "Defender", photo: "https://media.api-sports.io/football/players/619.png", preferredFoot: "Right", height: 183, shirtNumber: 2 },
  { apiPlayerId: 138760, name: "Joško Gvardiol", team: "Manchester City", league: "Premier League", nationality: "Croatia", age: 22, position: "Defender", photo: "https://media.api-sports.io/football/players/138760.png", preferredFoot: "Left", height: 185, shirtNumber: 4 },
  { apiPlayerId: 628, name: "Mateo Kovačić", team: "Manchester City", league: "Premier League", nationality: "Croatia", age: 30, position: "Midfielder", photo: "https://media.api-sports.io/football/players/628.png", preferredFoot: "Right", height: 178, shirtNumber: 8 },
  { apiPlayerId: 620, name: "Nathan Aké", team: "Manchester City", league: "Premier League", nationality: "Netherlands", age: 29, position: "Defender", photo: "https://media.api-sports.io/football/players/620.png", preferredFoot: "Left", height: 180, shirtNumber: 6 },
  { apiPlayerId: 1144, name: "Manuel Akanji", team: "Manchester City", league: "Premier League", nationality: "Switzerland", age: 28, position: "Defender", photo: "https://media.api-sports.io/football/players/1144.png", preferredFoot: "Right", height: 187, shirtNumber: 25 },
  
  // --- ARSENAL EXTRA ---
  { apiPlayerId: 116117, name: "William Saliba", team: "Arsenal", league: "Premier League", nationality: "France", age: 23, position: "Defender", photo: "https://media.api-sports.io/football/players/116117.png", preferredFoot: "Right", height: 192, shirtNumber: 2 },
  { apiPlayerId: 37127, name: "Martin Ødegaard", team: "Arsenal", league: "Premier League", nationality: "Norway", age: 25, position: "Midfielder", photo: "https://media.api-sports.io/football/players/37127.png", preferredFoot: "Left", height: 178, shirtNumber: 8 },
  { apiPlayerId: 18765, name: "Declan Rice", team: "Arsenal", league: "Premier League", nationality: "England", age: 25, position: "Midfielder", photo: "https://media.api-sports.io/football/players/18765.png", preferredFoot: "Right", height: 185, shirtNumber: 41 },
  { apiPlayerId: 643, name: "Gabriel Jesus", team: "Arsenal", league: "Premier League", nationality: "Brazil", age: 27, position: "Attacker", photo: "https://media.api-sports.io/football/players/643.png", preferredFoot: "Right", height: 175, shirtNumber: 9 },
  { apiPlayerId: 1141, name: "Gabriel Martinelli", team: "Arsenal", league: "Premier League", nationality: "Brazil", age: 23, position: "Attacker", photo: "https://media.api-sports.io/football/players/1141.png", preferredFoot: "Right", height: 178, shirtNumber: 11 },
  { apiPlayerId: 963, name: "Kai Havertz", team: "Arsenal", league: "Premier League", nationality: "Germany", age: 25, position: "Attacker", photo: "https://media.api-sports.io/football/players/963.png", preferredFoot: "Left", height: 193, shirtNumber: 29 },
  { apiPlayerId: 2283, name: "Leandro Trossard", team: "Arsenal", league: "Premier League", nationality: "Belgium", age: 29, position: "Attacker", photo: "https://media.api-sports.io/football/players/2283.png", preferredFoot: "Right", height: 172, shirtNumber: 19 },
  { apiPlayerId: 114, name: "David Raya", team: "Arsenal", league: "Premier League", nationality: "Spain", age: 28, position: "Goalkeeper", photo: "https://media.api-sports.io/football/players/114.png", preferredFoot: "Right", height: 183, shirtNumber: 22 },
  { apiPlayerId: 116118, name: "Gabriel Magalhães", team: "Arsenal", league: "Premier League", nationality: "Brazil", age: 26, position: "Defender", photo: "https://media.api-sports.io/football/players/116118.png", preferredFoot: "Left", height: 190, shirtNumber: 6 },
  { apiPlayerId: 18814, name: "Ben White", team: "Arsenal", league: "Premier League", nationality: "England", age: 26, position: "Defender", photo: "https://media.api-sports.io/football/players/18814.png", preferredFoot: "Right", height: 186, shirtNumber: 4 },
  { apiPlayerId: 630, name: "Oleksandr Zinchenko", team: "Arsenal", league: "Premier League", nationality: "Ukraine", age: 27, position: "Defender", photo: "https://media.api-sports.io/football/players/630.png", preferredFoot: "Left", height: 175, shirtNumber: 35 },
  { apiPlayerId: 268, name: "Thomas Partey", team: "Arsenal", league: "Premier League", nationality: "Ghana", age: 31, position: "Midfielder", photo: "https://media.api-sports.io/football/players/268.png", preferredFoot: "Right", height: 185, shirtNumber: 5 },
  { apiPlayerId: 2286, name: "Jorginho", team: "Arsenal", league: "Premier League", nationality: "Italy", age: 32, position: "Midfielder", photo: "https://media.api-sports.io/football/players/2286.png", preferredFoot: "Right", height: 180, shirtNumber: 20 },
  { apiPlayerId: 22140, name: "Jurrien Timber", team: "Arsenal", league: "Premier League", nationality: "Netherlands", age: 23, position: "Defender", photo: "https://media.api-sports.io/football/players/22140.png", preferredFoot: "Right", height: 182, shirtNumber: 12 },
  
  // --- LIVERPOOL EXTRA ---
  { apiPlayerId: 2486, name: "Luis Díaz", team: "Liverpool", league: "Premier League", nationality: "Colombia", age: 27, position: "Attacker", photo: "https://media.api-sports.io/football/players/2486.png", preferredFoot: "Right", height: 180, shirtNumber: 7 },
  { apiPlayerId: 21221, name: "Darwin Núñez", team: "Liverpool", league: "Premier League", nationality: "Uruguay", age: 24, position: "Attacker", photo: "https://media.api-sports.io/football/players/21221.png", preferredFoot: "Right", height: 187, shirtNumber: 9 },
  { apiPlayerId: 138804, name: "Dominik Szoboszlai", team: "Liverpool", league: "Premier League", nationality: "Hungary", age: 23, position: "Midfielder", photo: "https://media.api-sports.io/football/players/138804.png", preferredFoot: "Right", height: 186, shirtNumber: 8 },
  { apiPlayerId: 18931, name: "Alexis Mac Allister", team: "Liverpool", league: "Premier League", nationality: "Argentina", age: 25, position: "Midfielder", photo: "https://media.api-sports.io/football/players/18931.png", preferredFoot: "Right", height: 176, shirtNumber: 10 },
  { apiPlayerId: 159, name: "Alisson Becker", team: "Liverpool", league: "Premier League", nationality: "Brazil", age: 31, position: "Goalkeeper", photo: "https://media.api-sports.io/football/players/159.png", preferredFoot: "Right", height: 191, shirtNumber: 1 },
  { apiPlayerId: 292, name: "Trent Alexander-Arnold", team: "Liverpool", league: "Premier League", nationality: "England", age: 25, position: "Defender", photo: "https://media.api-sports.io/football/players/292.png", preferredFoot: "Right", height: 180, shirtNumber: 66 },
  { apiPlayerId: 294, name: "Andrew Robertson", team: "Liverpool", league: "Premier League", nationality: "Scotland", age: 30, position: "Defender", photo: "https://media.api-sports.io/football/players/294.png", preferredFoot: "Left", height: 178, shirtNumber: 3 },
  { apiPlayerId: 22137, name: "Cody Gakpo", team: "Liverpool", league: "Premier League", nationality: "Netherlands", age: 25, position: "Attacker", photo: "https://media.api-sports.io/football/players/22137.png", preferredFoot: "Right", height: 193, shirtNumber: 18 },
  { apiPlayerId: 1903, name: "Diogo Jota", team: "Liverpool", league: "Premier League", nationality: "Portugal", age: 27, position: "Attacker", photo: "https://media.api-sports.io/football/players/1903.png", preferredFoot: "Right", height: 178, shirtNumber: 20 },
  { apiPlayerId: 161806, name: "Wataru Endo", team: "Liverpool", league: "Premier League", nationality: "Japan", age: 31, position: "Midfielder", photo: "https://media.api-sports.io/football/players/161806.png", preferredFoot: "Right", height: 178, shirtNumber: 3 },
  { apiPlayerId: 1145, name: "Ibrahima Konaté", team: "Liverpool", league: "Premier League", nationality: "France", age: 25, position: "Defender", photo: "https://media.api-sports.io/football/players/1145.png", preferredFoot: "Right", height: 194, shirtNumber: 5 },
  { apiPlayerId: 22139, name: "Ryan Gravenberch", team: "Liverpool", league: "Premier League", nationality: "Netherlands", age: 22, position: "Midfielder", photo: "https://media.api-sports.io/football/players/22139.png", preferredFoot: "Right", height: 190, shirtNumber: 38 },
  
  // --- MANCHESTER UNITED EXTRA ---
  { apiPlayerId: 1485, name: "Bruno Fernandes", team: "Manchester United", league: "Premier League", nationality: "Portugal", age: 29, position: "Midfielder", photo: "https://media.api-sports.io/football/players/1485.png", preferredFoot: "Right", height: 179, shirtNumber: 8 },
  { apiPlayerId: 909, name: "Marcus Rashford", team: "Manchester United", league: "Premier League", nationality: "England", age: 26, position: "Attacker", photo: "https://media.api-sports.io/football/players/909.png", preferredFoot: "Right", height: 186, shirtNumber: 10 },
  { apiPlayerId: 147981, name: "Rasmus Højlund", team: "Manchester United", league: "Premier League", nationality: "Denmark", age: 21, position: "Attacker", photo: "https://media.api-sports.io/football/players/147981.png", preferredFoot: "Left", height: 191, shirtNumber: 9 },
  { apiPlayerId: 192023, name: "Alejandro Garnacho", team: "Manchester United", league: "Premier League", nationality: "Argentina", age: 19, position: "Attacker", photo: "https://media.api-sports.io/football/players/192023.png", preferredFoot: "Right", height: 180, shirtNumber: 17 },
  { apiPlayerId: 743, name: "Casemiro", team: "Manchester United", league: "Premier League", nationality: "Brazil", age: 32, position: "Midfielder", photo: "https://media.api-sports.io/football/players/743.png", preferredFoot: "Right", height: 185, shirtNumber: 18 },
  { apiPlayerId: 284242, name: "Kobbie Mainoo", team: "Manchester United", league: "Premier League", nationality: "England", age: 19, position: "Midfielder", photo: "https://media.api-sports.io/football/players/284242.png", preferredFoot: "Right", height: 175, shirtNumber: 37 },
  { apiPlayerId: 172, name: "André Onana", team: "Manchester United", league: "Premier League", nationality: "Cameroon", age: 28, position: "Goalkeeper", photo: "https://media.api-sports.io/football/players/172.png", preferredFoot: "Right", height: 190, shirtNumber: 24 },
  { apiPlayerId: 2094, name: "Lisandro Martínez", team: "Manchester United", league: "Premier League", nationality: "Argentina", age: 26, position: "Defender", photo: "https://media.api-sports.io/football/players/2094.png", preferredFoot: "Left", height: 175, shirtNumber: 6 },
  { apiPlayerId: 161808, name: "Antony", team: "Manchester United", league: "Premier League", nationality: "Brazil", age: 24, position: "Attacker", photo: "https://media.api-sports.io/football/players/161808.png", preferredFoot: "Left", height: 174, shirtNumber: 21 },
  { apiPlayerId: 293, name: "Harry Maguire", team: "Manchester United", league: "Premier League", nationality: "England", age: 31, position: "Defender", photo: "https://media.api-sports.io/football/players/293.png", preferredFoot: "Right", height: 194, shirtNumber: 5 },
  { apiPlayerId: 22152, name: "Diogo Dalot", team: "Manchester United", league: "Premier League", nationality: "Portugal", age: 25, position: "Defender", photo: "https://media.api-sports.io/football/players/22152.png", preferredFoot: "Right", height: 184, shirtNumber: 20 },
  { apiPlayerId: 905, name: "Luke Shaw", team: "Manchester United", league: "Premier League", nationality: "England", age: 28, position: "Defender", photo: "https://media.api-sports.io/football/players/905.png", preferredFoot: "Left", height: 178, shirtNumber: 23 },
  { apiPlayerId: 191, name: "Christian Eriksen", team: "Manchester United", league: "Premier League", nationality: "Denmark", age: 32, position: "Midfielder", photo: "https://media.api-sports.io/football/players/191.png", preferredFoot: "Right", height: 182, shirtNumber: 14 },
  { apiPlayerId: 903, name: "Scott McTominay", team: "Manchester United", league: "Premier League", nationality: "Scotland", age: 27, position: "Midfielder", photo: "https://media.api-sports.io/football/players/903.png", preferredFoot: "Right", height: 193, shirtNumber: 39 },
  { apiPlayerId: 18861, name: "Mason Mount", team: "Manchester United", league: "Premier League", nationality: "England", age: 25, position: "Midfielder", photo: "https://media.api-sports.io/football/players/18861.png", preferredFoot: "Right", height: 181, shirtNumber: 7 },
  
  // --- CHELSEA EXTRA ---
  { apiPlayerId: 192226, name: "Enzo Fernández", team: "Chelsea", league: "Premier League", nationality: "Argentina", age: 23, position: "Midfielder", photo: "https://media.api-sports.io/football/players/192226.png", preferredFoot: "Right", height: 178, shirtNumber: 8 },
  { apiPlayerId: 18776, name: "Moises Caicedo", team: "Chelsea", league: "Premier League", nationality: "Ecuador", age: 22, position: "Midfielder", photo: "https://media.api-sports.io/football/players/18776.png", preferredFoot: "Right", height: 178, shirtNumber: 25 },
  { apiPlayerId: 144410, name: "Mykhailo Mudryk", team: "Chelsea", league: "Premier League", nationality: "Ukraine", age: 23, position: "Attacker", photo: "https://media.api-sports.io/football/players/144410.png", preferredFoot: "Right", height: 175, shirtNumber: 10 },
  { apiPlayerId: 116131, name: "Nicolas Jackson", team: "Chelsea", league: "Premier League", nationality: "Senegal", age: 23, position: "Attacker", photo: "https://media.api-sports.io/football/players/116131.png", preferredFoot: "Right", height: 186, shirtNumber: 15 },
  { apiPlayerId: 277, name: "Christopher Nkunku", team: "Chelsea", league: "Premier League", nationality: "France", age: 26, position: "Attacker", photo: "https://media.api-sports.io/football/players/277.png", preferredFoot: "Right", height: 175, shirtNumber: 18 },
  { apiPlayerId: 18775, name: "Reece James", team: "Chelsea", league: "Premier League", nationality: "England", age: 24, position: "Defender", photo: "https://media.api-sports.io/football/players/18775.png", preferredFoot: "Right", height: 180, shirtNumber: 24 },
  { apiPlayerId: 161807, name: "Malo Gusto", team: "Chelsea", league: "Premier League", nationality: "France", age: 21, position: "Defender", photo: "https://media.api-sports.io/football/players/161807.png", preferredFoot: "Right", height: 179, shirtNumber: 27 },
  { apiPlayerId: 739, name: "Marc Cucurella", team: "Chelsea", league: "Premier League", nationality: "Spain", age: 25, position: "Defender", photo: "https://media.api-sports.io/football/players/739.png", preferredFoot: "Left", height: 172, shirtNumber: 3 },
  { apiPlayerId: 147816, name: "Noni Madueke", team: "Chelsea", league: "Premier League", nationality: "England", age: 22, position: "Attacker", photo: "https://media.api-sports.io/football/players/147816.png", preferredFoot: "Left", height: 182, shirtNumber: 11 },
  
  // --- TOTTENHAM EXTRA ---
  { apiPlayerId: 186, name: "Son Heung-min", team: "Tottenham", league: "Premier League", nationality: "South Korea", age: 31, position: "Attacker", photo: "https://media.api-sports.io/football/players/186.png", preferredFoot: "Right", height: 184, shirtNumber: 7 },
  { apiPlayerId: 188, name: "James Maddison", team: "Tottenham", league: "Premier League", nationality: "England", age: 27, position: "Midfielder", photo: "https://media.api-sports.io/football/players/188.png", preferredFoot: "Right", height: 175, shirtNumber: 10 },
  { apiPlayerId: 178, name: "Cristian Romero", team: "Tottenham", league: "Premier League", nationality: "Argentina", age: 26, position: "Defender", photo: "https://media.api-sports.io/football/players/178.png", preferredFoot: "Right", height: 185, shirtNumber: 17 },
  { apiPlayerId: 30813, name: "Guglielmo Vicario", team: "Tottenham", league: "Premier League", nationality: "Italy", age: 27, position: "Goalkeeper", photo: "https://media.api-sports.io/football/players/30813.png", preferredFoot: "Right", height: 194, shirtNumber: 13 },
  { apiPlayerId: 741, name: "Pedro Porro", team: "Tottenham", league: "Premier League", nationality: "Spain", age: 24, position: "Defender", photo: "https://media.api-sports.io/football/players/741.png", preferredFoot: "Right", height: 173, shirtNumber: 23 },
  { apiPlayerId: 161803, name: "Destiny Udogie", team: "Tottenham", league: "Premier League", nationality: "Italy", age: 21, position: "Defender", photo: "https://media.api-sports.io/football/players/161803.png", preferredFoot: "Left", height: 188, shirtNumber: 38 },
  { apiPlayerId: 2115, name: "Richarlison", team: "Tottenham", league: "Premier League", nationality: "Brazil", age: 27, position: "Attacker", photo: "https://media.api-sports.io/football/players/2115.png", preferredFoot: "Right", height: 184, shirtNumber: 9 },
  { apiPlayerId: 18858, name: "Yves Bissouma", team: "Tottenham", league: "Premier League", nationality: "Mali", age: 27, position: "Midfielder", photo: "https://media.api-sports.io/football/players/18858.png", preferredFoot: "Right", height: 182, shirtNumber: 8 },
  { apiPlayerId: 1042, name: "Rodrigo Bentancur", team: "Tottenham", league: "Premier League", nationality: "Uruguay", age: 26, position: "Midfielder", photo: "https://media.api-sports.io/football/players/1042.png", preferredFoot: "Right", height: 187, shirtNumber: 30 },
  { apiPlayerId: 19020, name: "Brennan Johnson", team: "Tottenham", league: "Premier League", nationality: "Wales", age: 23, position: "Attacker", photo: "https://media.api-sports.io/football/players/19020.png", preferredFoot: "Right", height: 179, shirtNumber: 22 },
  { apiPlayerId: 1118, name: "Timo Werner", team: "Tottenham", league: "Premier League", nationality: "Germany", age: 28, position: "Attacker", photo: "https://media.api-sports.io/football/players/1118.png", preferredFoot: "Right", height: 180, shirtNumber: 16 },
  { apiPlayerId: 197475, name: "Micky van de Ven", team: "Tottenham", league: "Premier League", nationality: "Netherlands", age: 23, position: "Defender", photo: "https://media.api-sports.io/football/players/197475.png", preferredFoot: "Left", height: 193, shirtNumber: 3 },
  { apiPlayerId: 30761, name: "Dejan Kulusevski", team: "Tottenham", league: "Premier League", nationality: "Sweden", age: 24, position: "Midfielder", photo: "https://media.api-sports.io/football/players/30761.png", preferredFoot: "Left", height: 186, shirtNumber: 21 },
  
  // --- BAYERN MUNICH EXTRA ---
  { apiPlayerId: 1114, name: "Leroy Sané", team: "Bayern Munich", league: "Bundesliga", nationality: "Germany", age: 28, position: "Attacker", photo: "https://media.api-sports.io/football/players/1114.png", preferredFoot: "Left", height: 183, shirtNumber: 10 },
  { apiPlayerId: 1113, name: "Serge Gnabry", team: "Bayern Munich", league: "Bundesliga", nationality: "Germany", age: 28, position: "Attacker", photo: "https://media.api-sports.io/football/players/1113.png", preferredFoot: "Right", height: 176, shirtNumber: 7 },
  { apiPlayerId: 1112, name: "Kingsley Coman", team: "Bayern Munich", league: "Bundesliga", nationality: "France", age: 28, position: "Attacker", photo: "https://media.api-sports.io/football/players/1112.png", preferredFoot: "Right", height: 180, shirtNumber: 11 },
  { apiPlayerId: 1110, name: "Thomas Müller", team: "Bayern Munich", league: "Bundesliga", nationality: "Germany", age: 34, position: "Attacker", photo: "https://media.api-sports.io/football/players/1110.png", preferredFoot: "Right", height: 185, shirtNumber: 25 },
  { apiPlayerId: 1111, name: "Joshua Kimmich", team: "Bayern Munich", league: "Bundesliga", nationality: "Germany", age: 29, position: "Midfielder", photo: "https://media.api-sports.io/football/players/1111.png", preferredFoot: "Right", height: 177, shirtNumber: 6 },
  { apiPlayerId: 1115, name: "Leon Goretzka", team: "Bayern Munich", league: "Bundesliga", nationality: "Germany", age: 29, position: "Midfielder", photo: "https://media.api-sports.io/football/players/1115.png", preferredFoot: "Right", height: 189, shirtNumber: 8 },
  { apiPlayerId: 1109, name: "Manuel Neuer", team: "Bayern Munich", league: "Bundesliga", nationality: "Germany", age: 38, position: "Goalkeeper", photo: "https://media.api-sports.io/football/players/1109.png", preferredFoot: "Right", height: 193, shirtNumber: 1 },
  { apiPlayerId: 1164, name: "Dayot Upamecano", team: "Bayern Munich", league: "Bundesliga", nationality: "France", age: 25, position: "Defender", photo: "https://media.api-sports.io/football/players/1164.png", preferredFoot: "Right", height: 186, shirtNumber: 2 },
  { apiPlayerId: 224, name: "Matthijs de Ligt", team: "Bayern Munich", league: "Bundesliga", nationality: "Netherlands", age: 24, position: "Defender", photo: "https://media.api-sports.io/football/players/224.png", preferredFoot: "Right", height: 188, shirtNumber: 4 },
  { apiPlayerId: 11123, name: "Alphonso Davies", team: "Bayern Munich", league: "Bundesliga", nationality: "Canada", age: 23, position: "Defender", photo: "https://media.api-sports.io/football/players/11123.png", preferredFoot: "Left", height: 183, shirtNumber: 19 },
  { apiPlayerId: 147818, name: "João Palhinha", team: "Bayern Munich", league: "Bundesliga", nationality: "Portugal", age: 28, position: "Midfielder", photo: "https://media.api-sports.io/football/players/147818.png", preferredFoot: "Right", height: 190, shirtNumber: 16 },
  { apiPlayerId: 116122, name: "Kim Min-jae", team: "Bayern Munich", league: "Bundesliga", nationality: "South Korea", age: 27, position: "Defender", photo: "https://media.api-sports.io/football/players/116122.png", preferredFoot: "Right", height: 190, shirtNumber: 3 },
  { apiPlayerId: 185, name: "Eric Dier", team: "Bayern Munich", league: "Bundesliga", nationality: "England", age: 30, position: "Defender", photo: "https://media.api-sports.io/football/players/185.png", preferredFoot: "Right", height: 188, shirtNumber: 15 },
  { apiPlayerId: 2753, name: "Raphaël Guerreiro", team: "Bayern Munich", league: "Bundesliga", nationality: "Portugal", age: 30, position: "Defender", photo: "https://media.api-sports.io/football/players/2753.png", preferredFoot: "Left", height: 170, shirtNumber: 22 },
  { apiPlayerId: 1143, name: "Konrad Laimer", team: "Bayern Munich", league: "Bundesliga", nationality: "Austria", age: 27, position: "Midfielder", photo: "https://media.api-sports.io/football/players/1143.png", preferredFoot: "Right", height: 180, shirtNumber: 27 },
  { apiPlayerId: 284247, name: "Aleksandar Pavlović", team: "Bayern Munich", league: "Bundesliga", nationality: "Germany", age: 20, position: "Midfielder", photo: "https://media.api-sports.io/football/players/284247.png", preferredFoot: "Right", height: 188, shirtNumber: 45 },
  
  // --- PSG EXTRA ---
  { apiPlayerId: 278, name: "Ousmane Dembélé", team: "PSG", league: "Ligue 1", nationality: "France", age: 27, position: "Attacker", photo: "https://media.api-sports.io/football/players/278.png", preferredFoot: "Both", height: 178, shirtNumber: 10 },
  { apiPlayerId: 742, name: "Achraf Hakimi", team: "PSG", league: "Ligue 1", nationality: "Morocco", age: 25, position: "Defender", photo: "https://media.api-sports.io/football/players/742.png", preferredFoot: "Right", height: 181, shirtNumber: 2 },
  { apiPlayerId: 282, name: "Marquinhos", team: "PSG", league: "Ligue 1", nationality: "Brazil", age: 30, position: "Defender", photo: "https://media.api-sports.io/football/players/282.png", preferredFoot: "Right", height: 183, shirtNumber: 5 },
  { apiPlayerId: 312, name: "Gianluigi Donnarumma", team: "PSG", league: "Ligue 1", nationality: "Italy", age: 25, position: "Goalkeeper", photo: "https://media.api-sports.io/football/players/312.png", preferredFoot: "Right", height: 196, shirtNumber: 99 },
  { apiPlayerId: 22238, name: "Vitinha", team: "PSG", league: "Ligue 1", nationality: "Portugal", age: 24, position: "Midfielder", photo: "https://media.api-sports.io/football/players/22238.png", preferredFoot: "Right", height: 172, shirtNumber: 17 },
  { apiPlayerId: 284310, name: "Warren Zaïre-Emery", team: "PSG", league: "Ligue 1", nationality: "France", age: 18, position: "Midfielder", photo: "https://media.api-sports.io/football/players/284310.png", preferredFoot: "Right", height: 178, shirtNumber: 33 },
  { apiPlayerId: 116119, name: "Randal Kolo Muani", team: "PSG", league: "Ligue 1", nationality: "France", age: 25, position: "Attacker", photo: "https://media.api-sports.io/football/players/116119.png", preferredFoot: "Right", height: 187, shirtNumber: 23 },
  { apiPlayerId: 284252, name: "João Neves", team: "PSG", league: "Ligue 1", nationality: "Portugal", age: 19, position: "Midfielder", photo: "https://media.api-sports.io/football/players/284252.png", preferredFoot: "Right", height: 174, shirtNumber: 87 },
  { apiPlayerId: 161805, name: "Bradley Barcola", team: "PSG", league: "Ligue 1", nationality: "France", age: 21, position: "Attacker", photo: "https://media.api-sports.io/football/players/161805.png", preferredFoot: "Right", height: 182, shirtNumber: 29 },
  { apiPlayerId: 30421, name: "Kang-in Lee", team: "PSG", league: "Ligue 1", nationality: "South Korea", age: 23, position: "Midfielder", photo: "https://media.api-sports.io/football/players/30421.png", preferredFoot: "Left", height: 173, shirtNumber: 19 },
  { apiPlayerId: 2280, name: "Lucas Hernández", team: "PSG", league: "Ligue 1", nationality: "France", age: 28, position: "Defender", photo: "https://media.api-sports.io/football/players/2280.png", preferredFoot: "Left", height: 184, shirtNumber: 21 },
  { apiPlayerId: 147814, name: "Nuno Mendes", team: "PSG", league: "Ligue 1", nationality: "Portugal", age: 21, position: "Defender", photo: "https://media.api-sports.io/football/players/147814.png", preferredFoot: "Left", height: 176, shirtNumber: 25 },
  
  // --- MLS / SAUDI PRO LEAGUE EXTRA ---
  { apiPlayerId: 190, name: "Luis Suárez", team: "Inter Miami", league: "MLS", nationality: "Uruguay", age: 37, position: "Attacker", photo: "https://media.api-sports.io/football/players/190.png", preferredFoot: "Right", height: 182, shirtNumber: 9 },
  { apiPlayerId: 748, name: "Sergio Busquets", team: "Inter Miami", league: "MLS", nationality: "Spain", age: 35, position: "Midfielder", photo: "https://media.api-sports.io/football/players/748.png", preferredFoot: "Right", height: 189, shirtNumber: 5 },
  { apiPlayerId: 749, name: "Jordi Alba", team: "Inter Miami", league: "MLS", nationality: "Spain", age: 35, position: "Defender", photo: "https://media.api-sports.io/football/players/749.png", preferredFoot: "Left", height: 170, shirtNumber: 18 },
  { apiPlayerId: 304, name: "Sadio Mané", team: "Al Nassr", league: "Saudi Pro League", nationality: "Senegal", age: 32, position: "Attacker", photo: "https://media.api-sports.io/football/players/304.png", preferredFoot: "Right", height: 174, shirtNumber: 10 },
  { apiPlayerId: 1492, name: "Marcelo Brozović", team: "Al Nassr", league: "Saudi Pro League", nationality: "Croatia", age: 31, position: "Midfielder", photo: "https://media.api-sports.io/football/players/1492.png", preferredFoot: "Right", height: 181, shirtNumber: 77 },
  { apiPlayerId: 622, name: "Aymeric Laporte", team: "Al Nassr", league: "Saudi Pro League", nationality: "Spain", age: 30, position: "Defender", photo: "https://media.api-sports.io/football/players/622.png", preferredFoot: "Left", height: 191, shirtNumber: 27 },
  { apiPlayerId: 274, name: "Neymar Jr", team: "Al Hilal", league: "Saudi Pro League", nationality: "Brazil", age: 32, position: "Attacker", photo: "https://media.api-sports.io/football/players/274.png", preferredFoot: "Right", height: 175, shirtNumber: 10 },
  { apiPlayerId: 911, name: "Aleksandar Mitrović", team: "Al Hilal", league: "Saudi Pro League", nationality: "Serbia", age: 29, position: "Attacker", photo: "https://media.api-sports.io/football/players/911.png", preferredFoot: "Right", height: 189, shirtNumber: 9 },
  { apiPlayerId: 318, name: "Sergej Milinković-Savić", team: "Al Hilal", league: "Saudi Pro League", nationality: "Serbia", age: 29, position: "Midfielder", photo: "https://media.api-sports.io/football/players/318.png", preferredFoot: "Right", height: 192, shirtNumber: 22 },
  { apiPlayerId: 288, name: "Kalidou Koulibaly", team: "Al Hilal", league: "Saudi Pro League", nationality: "Senegal", age: 33, position: "Defender", photo: "https://media.api-sports.io/football/players/288.png", preferredFoot: "Right", height: 195, shirtNumber: 3 },
  { apiPlayerId: 174, name: "Yassine Bounou", team: "Al Hilal", league: "Saudi Pro League", nationality: "Morocco", age: 33, position: "Goalkeeper", photo: "https://media.api-sports.io/football/players/174.png", preferredFoot: "Right", height: 192, shirtNumber: 37 },
  { apiPlayerId: 759, name: "Karim Benzema", team: "Al Ittihad", league: "Saudi Pro League", nationality: "France", age: 36, position: "Attacker", photo: "https://media.api-sports.io/football/players/759.png", preferredFoot: "Right", height: 185, shirtNumber: 9 },
  { apiPlayerId: 2289, name: "N'Golo Kanté", team: "Al Ittihad", league: "Saudi Pro League", nationality: "France", age: 33, position: "Midfielder", photo: "https://media.api-sports.io/football/players/2289.png", preferredFoot: "Right", height: 168, shirtNumber: 7 },
  { apiPlayerId: 636, name: "Riyad Mahrez", team: "Al Ahli", league: "Saudi Pro League", nationality: "Algeria", age: 33, position: "Attacker", photo: "https://media.api-sports.io/football/players/636.png", preferredFoot: "Left", height: 179, shirtNumber: 7 },
  { apiPlayerId: 300, name: "Roberto Firmino", team: "Al Ahli", league: "Saudi Pro League", nationality: "Brazil", age: 32, position: "Attacker", photo: "https://media.api-sports.io/football/players/300.png", preferredFoot: "Right", height: 181, shirtNumber: 10 },
  { apiPlayerId: 2287, name: "Edouard Mendy", team: "Al Ahli", league: "Saudi Pro League", nationality: "Senegal", age: 32, position: "Goalkeeper", photo: "https://media.api-sports.io/football/players/2287.png", preferredFoot: "Right", height: 194, shirtNumber: 16 },
  { apiPlayerId: 299, name: "Fabinho", team: "Al Ittihad", league: "Saudi Pro League", nationality: "Brazil", age: 30, position: "Midfielder", photo: "https://media.api-sports.io/football/players/299.png", preferredFoot: "Right", height: 188, shirtNumber: 8 },
  { apiPlayerId: 296, name: "Georginio Wijnaldum", team: "Al Ettifaq", league: "Saudi Pro League", nationality: "Netherlands", age: 33, position: "Midfielder", photo: "https://media.api-sports.io/football/players/296.png", preferredFoot: "Right", height: 175, shirtNumber: 25 },
  { apiPlayerId: 1127, name: "Marco Reus", team: "LA Galaxy", league: "MLS", nationality: "Germany", age: 35, position: "Midfielder", photo: "https://media.api-sports.io/football/players/1127.png", preferredFoot: "Right", height: 180, shirtNumber: 11 },
  { apiPlayerId: 10, name: "Olivier Giroud", team: "LAFC", league: "MLS", nationality: "France", age: 37, position: "Attacker", photo: "https://media.api-sports.io/football/players/10.png", preferredFoot: "Left", height: 193, shirtNumber: 9 },

  // --- ATLETICO MADRID EXTRA ---
  { apiPlayerId: 260, name: "Antoine Griezmann", team: "Atletico Madrid", league: "La Liga", nationality: "France", age: 33, position: "Attacker", photo: "https://media.api-sports.io/football/players/260.png", preferredFoot: "Left", height: 176, shirtNumber: 7 },
  { apiPlayerId: 262, name: "Jan Oblak", team: "Atletico Madrid", league: "La Liga", nationality: "Slovenia", age: 31, position: "Goalkeeper", photo: "https://media.api-sports.io/football/players/262.png", preferredFoot: "Right", height: 188, shirtNumber: 13 },
  { apiPlayerId: 109, name: "Alvaro Morata", team: "Atletico Madrid", league: "La Liga", nationality: "Spain", age: 31, position: "Attacker", photo: "https://media.api-sports.io/football/players/109.png", preferredFoot: "Right", height: 189, shirtNumber: 19 },
  { apiPlayerId: 18911, name: "Conor Gallagher", team: "Atletico Madrid", league: "La Liga", nationality: "England", age: 24, position: "Midfielder", photo: "https://media.api-sports.io/football/players/18911.png", preferredFoot: "Right", height: 182, shirtNumber: 4 },
  { apiPlayerId: 30784, name: "Rodrigo de Paul", team: "Atletico Madrid", league: "La Liga", nationality: "Argentina", age: 30, position: "Midfielder", photo: "https://media.api-sports.io/football/players/30784.png", preferredFoot: "Right", height: 180, shirtNumber: 5 },
  { apiPlayerId: 266, name: "Koke", team: "Atletico Madrid", league: "La Liga", nationality: "Spain", age: 32, position: "Midfielder", photo: "https://media.api-sports.io/football/players/266.png", preferredFoot: "Right", height: 176, shirtNumber: 6 },
  { apiPlayerId: 744, name: "Marcos Llorente", team: "Atletico Madrid", league: "La Liga", nationality: "Spain", age: 29, position: "Midfielder", photo: "https://media.api-sports.io/football/players/744.png", preferredFoot: "Right", height: 184, shirtNumber: 14 },

  // --- ATHLETIC BILBAO & OTHER LA LIGA ---
  { apiPlayerId: 193570, name: "Nico Williams", team: "Athletic Bilbao", league: "La Liga", nationality: "Spain", age: 21, position: "Attacker", photo: "https://media.api-sports.io/football/players/193570.png", preferredFoot: "Right", height: 181, shirtNumber: 11 },
  { apiPlayerId: 729, name: "Iñaki Williams", team: "Athletic Bilbao", league: "La Liga", nationality: "Ghana", age: 30, position: "Attacker", photo: "https://media.api-sports.io/football/players/729.png", preferredFoot: "Right", height: 186, shirtNumber: 9 },

  // --- NEWCASTLE & ASTON VILLA & WEST HAM ---
  { apiPlayerId: 21209, name: "Bruno Guimarães", team: "Newcastle", league: "Premier League", nationality: "Brazil", age: 26, position: "Midfielder", photo: "https://media.api-sports.io/football/players/21209.png", preferredFoot: "Right", height: 182, shirtNumber: 39 },
  { apiPlayerId: 325, name: "Alexander Isak", team: "Newcastle", league: "Premier League", nationality: "Sweden", age: 24, position: "Attacker", photo: "https://media.api-sports.io/football/players/325.png", preferredFoot: "Right", height: 192, shirtNumber: 14 },
  { apiPlayerId: 625, name: "Kieran Trippier", team: "Newcastle", league: "Premier League", nationality: "England", age: 33, position: "Defender", photo: "https://media.api-sports.io/football/players/625.png", preferredFoot: "Right", height: 178, shirtNumber: 2 },
  { apiPlayerId: 19024, name: "Anthony Gordon", team: "Newcastle", league: "Premier League", nationality: "England", age: 23, position: "Attacker", photo: "https://media.api-sports.io/football/players/19024.png", preferredFoot: "Right", height: 183, shirtNumber: 10 },
  { apiPlayerId: 22141, name: "Sven Botman", team: "Newcastle", league: "Premier League", nationality: "Netherlands", age: 24, position: "Defender", photo: "https://media.api-sports.io/football/players/22141.png", preferredFoot: "Left", height: 193, shirtNumber: 4 },
  { apiPlayerId: 18804, name: "Nick Pope", team: "Newcastle", league: "Premier League", nationality: "England", age: 32, position: "Goalkeeper", photo: "https://media.api-sports.io/football/players/18804.png", preferredFoot: "Right", height: 191, shirtNumber: 22 },
  { apiPlayerId: 161, name: "Emiliano Martínez", team: "Aston Villa", league: "Premier League", nationality: "Argentina", age: 31, position: "Goalkeeper", photo: "https://media.api-sports.io/football/players/161.png", preferredFoot: "Right", height: 195, shirtNumber: 1 },
  { apiPlayerId: 19013, name: "Ollie Watkins", team: "Aston Villa", league: "Premier League", nationality: "England", age: 28, position: "Attacker", photo: "https://media.api-sports.io/football/players/19013.png", preferredFoot: "Right", height: 180, shirtNumber: 11 },
  { apiPlayerId: 2135, name: "Douglas Luiz", team: "Aston Villa", league: "Premier League", nationality: "Brazil", age: 26, position: "Midfielder", photo: "https://media.api-sports.io/football/players/2135.png", preferredFoot: "Right", height: 178, shirtNumber: 6 },
  { apiPlayerId: 19001, name: "John McGinn", team: "Aston Villa", league: "Premier League", nationality: "Scotland", age: 29, position: "Midfielder", photo: "https://media.api-sports.io/football/players/19001.png", preferredFoot: "Left", height: 178, shirtNumber: 7 },
  { apiPlayerId: 1937, name: "Leon Bailey", team: "Aston Villa", league: "Premier League", nationality: "Jamaica", age: 26, position: "Attacker", photo: "https://media.api-sports.io/football/players/1937.png", preferredFoot: "Left", height: 178, shirtNumber: 31 },
  { apiPlayerId: 22230, name: "Moussa Diaby", team: "Aston Villa", league: "Premier League", nationality: "France", age: 24, position: "Attacker", photo: "https://media.api-sports.io/football/players/22230.png", preferredFoot: "Left", height: 170, shirtNumber: 19 },
  { apiPlayerId: 18816, name: "Ezri Konsa", team: "Aston Villa", league: "Premier League", nationality: "England", age: 26, position: "Defender", photo: "https://media.api-sports.io/football/players/18816.png", preferredFoot: "Right", height: 183, shirtNumber: 4 },
  { apiPlayerId: 116121, name: "Pau Torres", team: "Aston Villa", league: "Premier League", nationality: "Spain", age: 27, position: "Defender", photo: "https://media.api-sports.io/football/players/116121.png", preferredFoot: "Left", height: 191, shirtNumber: 14 },
  { apiPlayerId: 19021, name: "Ian Maatsen", team: "Aston Villa", league: "Premier League", nationality: "Netherlands", age: 22, position: "Defender", photo: "https://media.api-sports.io/football/players/19021.png", preferredFoot: "Left", height: 167, shirtNumber: 22 },
  { apiPlayerId: 18885, name: "Jarrod Bowen", team: "West Ham", league: "Premier League", nationality: "England", age: 27, position: "Attacker", photo: "https://media.api-sports.io/football/players/18885.png", preferredFoot: "Left", height: 179, shirtNumber: 20 },
  { apiPlayerId: 2154, name: "Lucas Paquetá", team: "West Ham", league: "Premier League", nationality: "Brazil", age: 26, position: "Midfielder", photo: "https://media.api-sports.io/football/players/2154.png", preferredFoot: "Left", height: 180, shirtNumber: 10 },
  { apiPlayerId: 22135, name: "Mohammed Kudus", team: "West Ham", league: "Premier League", nationality: "Ghana", age: 23, position: "Midfielder", photo: "https://media.api-sports.io/football/players/22135.png", preferredFoot: "Left", height: 177, shirtNumber: 14 },

  // --- BRIGHTON ---
  { apiPlayerId: 161804, name: "Kaoru Mitoma", team: "Brighton", league: "Premier League", nationality: "Japan", age: 27, position: "Attacker", photo: "https://media.api-sports.io/football/players/161804.png", preferredFoot: "Right", height: 178, shirtNumber: 22 },
  { apiPlayerId: 22153, name: "João Pedro", team: "Brighton", league: "Premier League", nationality: "Brazil", age: 22, position: "Attacker", photo: "https://media.api-sports.io/football/players/22153.png", preferredFoot: "Right", height: 182, shirtNumber: 9 },

  // --- BAYER LEVERKUSEN & BORUSSIA DORTMUND ---
  { apiPlayerId: 147852, name: "Florian Wirtz", team: "Bayer Leverkusen", league: "Bundesliga", nationality: "Germany", age: 21, position: "Midfielder", photo: "https://media.api-sports.io/football/players/147852.png", preferredFoot: "Right", height: 177, shirtNumber: 10 },
  { apiPlayerId: 22143, name: "Jeremie Frimpong", team: "Bayer Leverkusen", league: "Bundesliga", nationality: "Netherlands", age: 23, position: "Defender", photo: "https://media.api-sports.io/football/players/22143.png", preferredFoot: "Right", height: 171, shirtNumber: 30 },
  { apiPlayerId: 2111, name: "Alejandro Grimaldo", team: "Bayer Leverkusen", league: "Bundesliga", nationality: "Spain", age: 28, position: "Defender", photo: "https://media.api-sports.io/football/players/2111.png", preferredFoot: "Left", height: 171, shirtNumber: 20 },
  { apiPlayerId: 1124, name: "Granit Xhaka", team: "Bayer Leverkusen", league: "Bundesliga", nationality: "Switzerland", age: 31, position: "Midfielder", photo: "https://media.api-sports.io/football/players/1124.png", preferredFoot: "Left", height: 185, shirtNumber: 34 },
  { apiPlayerId: 136159, name: "Victor Boniface", team: "Bayer Leverkusen", league: "Bundesliga", nationality: "Nigeria", age: 23, position: "Attacker", photo: "https://media.api-sports.io/football/players/136159.png", preferredFoot: "Right", height: 189, shirtNumber: 22 },
  { apiPlayerId: 124, name: "Jonathan Tah", team: "Bayer Leverkusen", league: "Bundesliga", nationality: "Germany", age: 28, position: "Defender", photo: "https://media.api-sports.io/football/players/124.png", preferredFoot: "Right", height: 195, shirtNumber: 4 },
  { apiPlayerId: 1152, name: "Patrik Schick", team: "Bayer Leverkusen", league: "Bundesliga", nationality: "Czech Republic", age: 28, position: "Attacker", photo: "https://media.api-sports.io/football/players/1152.png", preferredFoot: "Left", height: 191, shirtNumber: 14 },
  { apiPlayerId: 18843, name: "Robert Andrich", team: "Bayer Leverkusen", league: "Bundesliga", nationality: "Germany", age: 29, position: "Midfielder", photo: "https://media.api-sports.io/football/players/18843.png", preferredFoot: "Right", height: 187, shirtNumber: 8 },
  { apiPlayerId: 2092, name: "Exequiel Palacios", team: "Bayer Leverkusen", league: "Bundesliga", nationality: "Argentina", age: 25, position: "Midfielder", photo: "https://media.api-sports.io/football/players/2092.png", preferredFoot: "Right", height: 177, shirtNumber: 25 },
  { apiPlayerId: 138809, name: "Piero Hincapié", team: "Bayer Leverkusen", league: "Bundesliga", nationality: "Ecuador", age: 22, position: "Defender", photo: "https://media.api-sports.io/football/players/138809.png", preferredFoot: "Left", height: 184, shirtNumber: 3 },
  { apiPlayerId: 22235, name: "Edmond Tapsoba", team: "Bayer Leverkusen", league: "Bundesliga", nationality: "Burkina Faso", age: 25, position: "Defender", photo: "https://media.api-sports.io/football/players/22235.png", preferredFoot: "Right", height: 194, shirtNumber: 12 },
  { apiPlayerId: 11000, name: "Lukáš Hrádecký", team: "Bayer Leverkusen", league: "Bundesliga", nationality: "Finland", age: 34, position: "Goalkeeper", photo: "https://media.api-sports.io/football/players/11000.png", preferredFoot: "Right", height: 190, shirtNumber: 1 },
  { apiPlayerId: 11119, name: "Gregor Kobel", team: "Borussia Dortmund", league: "Bundesliga", nationality: "Switzerland", age: 26, position: "Goalkeeper", photo: "https://media.api-sports.io/football/players/11119.png", preferredFoot: "Right", height: 195, shirtNumber: 1 },
  { apiPlayerId: 1125, name: "Julian Brandt", team: "Borussia Dortmund", league: "Bundesliga", nationality: "Germany", age: 28, position: "Midfielder", photo: "https://media.api-sports.io/football/players/1125.png", preferredFoot: "Right", height: 185, shirtNumber: 19 },
  { apiPlayerId: 147822, name: "Nico Schlotterbeck", team: "Borussia Dortmund", league: "Bundesliga", nationality: "Germany", age: 24, position: "Defender", photo: "https://media.api-sports.io/football/players/147822.png", preferredFoot: "Left", height: 191, shirtNumber: 4 },
  { apiPlayerId: 11124, name: "Mats Hummels", team: "Roma", league: "Serie A", nationality: "Germany", age: 35, position: "Defender", photo: "https://media.api-sports.io/football/players/11124.png", preferredFoot: "Right", height: 191, shirtNumber: 15 },
  { apiPlayerId: 1122, name: "Marcel Sabitzer", team: "Borussia Dortmund", league: "Bundesliga", nationality: "Austria", age: 30, position: "Midfielder", photo: "https://media.api-sports.io/football/players/1122.png", preferredFoot: "Right", height: 178, shirtNumber: 20 },
  { apiPlayerId: 138805, name: "Karim Adeyemi", team: "Borussia Dortmund", league: "Bundesliga", nationality: "Germany", age: 22, position: "Attacker", photo: "https://media.api-sports.io/football/players/138805.png", preferredFoot: "Left", height: 180, shirtNumber: 27 },
  { apiPlayerId: 22138, name: "Donyell Malen", team: "Borussia Dortmund", league: "Bundesliga", nationality: "Netherlands", age: 25, position: "Attacker", photo: "https://media.api-sports.io/football/players/22138.png", preferredFoot: "Right", height: 179, shirtNumber: 21 },
  { apiPlayerId: 11160, name: "Emre Can", team: "Borussia Dortmund", league: "Bundesliga", nationality: "Germany", age: 30, position: "Midfielder", photo: "https://media.api-sports.io/football/players/11160.png", preferredFoot: "Right", height: 186, shirtNumber: 23 },
  { apiPlayerId: 11118, name: "Niklas Süle", team: "Borussia Dortmund", league: "Bundesliga", nationality: "Germany", age: 28, position: "Defender", photo: "https://media.api-sports.io/football/players/11118.png", preferredFoot: "Right", height: 195, shirtNumber: 25 },
  { apiPlayerId: 116126, name: "Julian Ryerson", team: "Borussia Dortmund", league: "Bundesliga", nationality: "Norway", age: 26, position: "Defender", photo: "https://media.api-sports.io/football/players/116126.png", preferredFoot: "Right", height: 183, shirtNumber: 26 },

  // --- SERIE A: INTER & MILAN & JUVENTUS & NAPOLI EXTRA ---
  { apiPlayerId: 912, name: "Federico Dimarco", team: "Inter Milan", league: "Serie A", nationality: "Italy", age: 26, position: "Defender", photo: "https://media.api-sports.io/football/players/912.png", preferredFoot: "Left", height: 175, shirtNumber: 3 },
  { apiPlayerId: 914, name: "Alessandro Bastoni", team: "Inter Milan", league: "Serie A", nationality: "Italy", age: 25, position: "Defender", photo: "https://media.api-sports.io/football/players/914.png", preferredFoot: "Left", height: 190, shirtNumber: 95 },
  { apiPlayerId: 310, name: "Nicolò Barella", team: "Inter Milan", league: "Serie A", nationality: "Italy", age: 27, position: "Midfielder", photo: "https://media.api-sports.io/football/players/310.png", preferredFoot: "Right", height: 172, shirtNumber: 23 },
  { apiPlayerId: 1146, name: "Hakan Çalhanoğlu", team: "Inter Milan", league: "Serie A", nationality: "Turkey", age: 30, position: "Midfielder", photo: "https://media.api-sports.io/football/players/1146.png", preferredFoot: "Right", height: 178, shirtNumber: 20 },
  { apiPlayerId: 1928, name: "Marcus Thuram", team: "Inter Milan", league: "Serie A", nationality: "France", age: 26, position: "Attacker", photo: "https://media.api-sports.io/football/players/1928.png", preferredFoot: "Right", height: 192, shirtNumber: 9 },
  { apiPlayerId: 104, name: "Benjamin Pavard", team: "Inter Milan", league: "Serie A", nationality: "France", age: 28, position: "Defender", photo: "https://media.api-sports.io/football/players/104.png", preferredFoot: "Right", height: 186, shirtNumber: 28 },
  { apiPlayerId: 213, name: "Yann Sommer", team: "Inter Milan", league: "Serie A", nationality: "Switzerland", age: 35, position: "Goalkeeper", photo: "https://media.api-sports.io/football/players/213.png", preferredFoot: "Right", height: 183, shirtNumber: 1 },
  { apiPlayerId: 22144, name: "Denzel Dumfries", team: "Inter Milan", league: "Serie A", nationality: "Netherlands", age: 28, position: "Defender", photo: "https://media.api-sports.io/football/players/22144.png", preferredFoot: "Right", height: 188, shirtNumber: 2 },
  { apiPlayerId: 2282, name: "Theo Hernández", team: "AC Milan", league: "Serie A", nationality: "France", age: 26, position: "Defender", photo: "https://media.api-sports.io/football/players/2282.png", preferredFoot: "Left", height: 184, shirtNumber: 19 },
  { apiPlayerId: 279, name: "Mike Maignan", team: "AC Milan", league: "Serie A", nationality: "France", age: 28, position: "Goalkeeper", photo: "https://media.api-sports.io/football/players/279.png", preferredFoot: "Right", height: 191, shirtNumber: 16 },
  { apiPlayerId: 1117, name: "Christian Pulisic", team: "AC Milan", league: "Serie A", nationality: "USA", age: 25, position: "Attacker", photo: "https://media.api-sports.io/football/players/1117.png", preferredFoot: "Right", height: 177, shirtNumber: 11 },
  { apiPlayerId: 18919, name: "Fikayo Tomori", team: "AC Milan", league: "Serie A", nationality: "England", age: 26, position: "Defender", photo: "https://media.api-sports.io/football/players/18919.png", preferredFoot: "Right", height: 185, shirtNumber: 23 },
  { apiPlayerId: 30819, name: "Dusan Vlahovic", team: "Juventus", league: "Serie A", nationality: "Serbia", age: 24, position: "Attacker", photo: "https://media.api-sports.io/football/players/30819.png", preferredFoot: "Left", height: 190, shirtNumber: 9 },
  { apiPlayerId: 21251, name: "Gleison Bremer", team: "Juventus", league: "Serie A", nationality: "Brazil", age: 27, position: "Defender", photo: "https://media.api-sports.io/football/players/21251.png", preferredFoot: "Right", height: 188, shirtNumber: 3 },
  { apiPlayerId: 30812, name: "Manuel Locatelli", team: "Juventus", league: "Serie A", nationality: "Italy", age: 26, position: "Midfielder", photo: "https://media.api-sports.io/football/players/30812.png", preferredFoot: "Right", height: 185, shirtNumber: 5 },
  { apiPlayerId: 2281, name: "Adrien Rabiot", team: "Marseille", league: "Ligue 1", nationality: "France", age: 29, position: "Midfielder", photo: "https://media.api-sports.io/football/players/2281.png", preferredFoot: "Left", height: 188, shirtNumber: 25 },
  { apiPlayerId: 738, name: "Danilo", team: "Juventus", league: "Serie A", nationality: "Brazil", age: 32, position: "Defender", photo: "https://media.api-sports.io/football/players/738.png", preferredFoot: "Right", height: 184, shirtNumber: 6 },
  { apiPlayerId: 11116, name: "Weston McKennie", team: "Juventus", league: "Serie A", nationality: "USA", age: 25, position: "Midfielder", photo: "https://media.api-sports.io/football/players/11116.png", preferredFoot: "Right", height: 185, shirtNumber: 16 },
  { apiPlayerId: 19163, name: "Khvicha Kvaratskhelia", team: "Napoli", league: "Serie A", nationality: "Georgia", age: 23, position: "Attacker", photo: "https://media.api-sports.io/football/players/19163.png", preferredFoot: "Right", height: 183, shirtNumber: 77 },
  { apiPlayerId: 275, name: "Victor Osimhen", team: "Galatasaray", league: "Turkish Super Lig", nationality: "Nigeria", age: 25, position: "Attacker", photo: "https://media.api-sports.io/football/players/275.png", preferredFoot: "Right", height: 185, shirtNumber: 45 },
  { apiPlayerId: 30800, name: "Giovanni Di Lorenzo", team: "Napoli", league: "Serie A", nationality: "Italy", age: 30, position: "Defender", photo: "https://media.api-sports.io/football/players/30800.png", preferredFoot: "Right", height: 183, shirtNumber: 22 },
  { apiPlayerId: 18883, name: "Frank Anguissa", team: "Napoli", league: "Serie A", nationality: "Cameroon", age: 28, position: "Midfielder", photo: "https://media.api-sports.io/football/players/18883.png", preferredFoot: "Right", height: 184, shirtNumber: 99 },
  { apiPlayerId: 730, name: "Stanislav Lobotka", team: "Napoli", league: "Serie A", nationality: "Slovakia", age: 29, position: "Midfielder", photo: "https://media.api-sports.io/football/players/730.png", preferredFoot: "Right", height: 170, shirtNumber: 68 },
  { apiPlayerId: 30801, name: "Alex Meret", team: "Napoli", league: "Serie A", nationality: "Italy", age: 27, position: "Goalkeeper", photo: "https://media.api-sports.io/football/players/30801.png", preferredFoot: "Right", height: 190, shirtNumber: 1 },

  // --- PORTUGUESE LEAGUE & EREDIVISIE ---
  { apiPlayerId: 764, name: "Angel Di Maria", team: "Benfica", league: "Primeira Liga", nationality: "Argentina", age: 36, position: "Attacker", photo: "https://media.api-sports.io/football/players/764.png", preferredFoot: "Left", height: 180, shirtNumber: 11 },
  { apiPlayerId: 766, name: "Nicolás Otamendi", team: "Benfica", league: "Primeira Liga", nationality: "Argentina", age: 36, position: "Defender", photo: "https://media.api-sports.io/football/players/766.png", preferredFoot: "Right", height: 183, shirtNumber: 30 },
  { apiPlayerId: 138811, name: "Anatoliy Trubin", team: "Benfica", league: "Primeira Liga", nationality: "Ukraine", age: 22, position: "Goalkeeper", photo: "https://media.api-sports.io/football/players/138811.png", preferredFoot: "Right", height: 199, shirtNumber: 1 },
  { apiPlayerId: 22240, name: "Florentino Luís", team: "Benfica", league: "Primeira Liga", nationality: "Portugal", age: 24, position: "Midfielder", photo: "https://media.api-sports.io/football/players/22240.png", preferredFoot: "Right", height: 184, shirtNumber: 61 },
  { apiPlayerId: 19022, name: "Viktor Gyökeres", team: "Sporting CP", league: "Primeira Liga", nationality: "Sweden", age: 26, position: "Attacker", photo: "https://media.api-sports.io/football/players/19022.png", preferredFoot: "Right", height: 187, shirtNumber: 9 },
  { apiPlayerId: 161813, name: "Pedro Gonçalves", team: "Sporting CP", league: "Primeira Liga", nationality: "Portugal", age: 25, position: "Midfielder", photo: "https://media.api-sports.io/football/players/161813.png", preferredFoot: "Right", height: 173, shirtNumber: 8 },
  { apiPlayerId: 161814, name: "Morten Hjulmand", team: "Sporting CP", league: "Primeira Liga", nationality: "Denmark", age: 24, position: "Midfielder", photo: "https://media.api-sports.io/football/players/161814.png", preferredFoot: "Right", height: 185, shirtNumber: 42 },
  { apiPlayerId: 161827, name: "Gonçalo Inácio", team: "Sporting CP", league: "Primeira Liga", nationality: "Portugal", age: 22, position: "Defender", photo: "https://media.api-sports.io/football/players/161827.png", preferredFoot: "Left", height: 185, shirtNumber: 25 },
  { apiPlayerId: 161828, name: "Ousmane Diomande", team: "Sporting CP", league: "Primeira Liga", nationality: "Ivory Coast", age: 20, position: "Defender", photo: "https://media.api-sports.io/football/players/161828.png", preferredFoot: "Right", height: 190, shirtNumber: 3 },
  { apiPlayerId: 147821, name: "Diogo Costa", team: "Porto", league: "Primeira Liga", nationality: "Portugal", age: 24, position: "Goalkeeper", photo: "https://media.api-sports.io/football/players/147821.png", preferredFoot: "Right", height: 186, shirtNumber: 99 },
  { apiPlayerId: 161823, name: "Alan Varela", team: "Porto", league: "Primeira Liga", nationality: "Argentina", age: 22, position: "Midfielder", photo: "https://media.api-sports.io/football/players/161823.png", preferredFoot: "Right", height: 177, shirtNumber: 22 },
  { apiPlayerId: 2123, name: "Pepê", team: "Porto", league: "Primeira Liga", nationality: "Brazil", age: 27, position: "Attacker", photo: "https://media.api-sports.io/football/players/2123.png", preferredFoot: "Right", height: 175, shirtNumber: 11 },
  { apiPlayerId: 2124, name: "Galeno", team: "Porto", league: "Primeira Liga", nationality: "Brazil", age: 26, position: "Attacker", photo: "https://media.api-sports.io/football/players/2124.png", preferredFoot: "Right", height: 179, shirtNumber: 13 },
  { apiPlayerId: 161815, name: "Santiago Giménez", team: "Feyenoord", league: "Eredivisie", nationality: "Mexico", age: 23, position: "Attacker", photo: "https://media.api-sports.io/football/players/161815.png", preferredFoot: "Left", height: 182, shirtNumber: 9 },
  { apiPlayerId: 22136, name: "Luuk de Jong", team: "PSV", league: "Eredivisie", nationality: "Netherlands", age: 33, position: "Attacker", photo: "https://media.api-sports.io/football/players/22136.png", preferredFoot: "Right", height: 188, shirtNumber: 9 },
  { apiPlayerId: 161816, name: "Joey Veerman", team: "PSV", league: "Eredivisie", nationality: "Netherlands", age: 25, position: "Midfielder", photo: "https://media.api-sports.io/football/players/161816.png", preferredFoot: "Right", height: 185, shirtNumber: 23 },
  { apiPlayerId: 161817, name: "Johan Bakayoko", team: "PSV", league: "Eredivisie", nationality: "Belgium", age: 21, position: "Attacker", photo: "https://media.api-sports.io/football/players/161817.png", preferredFoot: "Left", height: 179, shirtNumber: 11 },
  { apiPlayerId: 161818, name: "Sergiño Dest", team: "PSV", league: "Eredivisie", nationality: "USA", age: 23, position: "Defender", photo: "https://media.api-sports.io/football/players/161818.png", preferredFoot: "Right", height: 175, shirtNumber: 8 },
  { apiPlayerId: 11001, name: "Hirving Lozano", team: "PSV", league: "Eredivisie", nationality: "Mexico", age: 28, position: "Attacker", photo: "https://media.api-sports.io/football/players/11001.png", preferredFoot: "Right", height: 175, shirtNumber: 27 },
  { apiPlayerId: 22239, name: "Walter Benítez", team: "PSV", league: "Eredivisie", nationality: "Argentina", age: 31, position: "Goalkeeper", photo: "https://media.api-sports.io/football/players/22239.png", preferredFoot: "Right", height: 191, shirtNumber: 1 },
  { apiPlayerId: 161819, name: "Brian Brobbey", team: "Ajax", league: "Eredivisie", nationality: "Netherlands", age: 22, position: "Attacker", photo: "https://media.api-sports.io/football/players/161819.png", preferredFoot: "Right", height: 180, shirtNumber: 9 },
  { apiPlayerId: 22134, name: "Steven Bergwijn", team: "Al Ittihad", league: "Saudi Pro League", nationality: "Netherlands", age: 26, position: "Attacker", photo: "https://media.api-sports.io/football/players/22134.png", preferredFoot: "Right", height: 178, shirtNumber: 34 },
  { apiPlayerId: 161820, name: "Devyne Rensch", team: "Ajax", league: "Eredivisie", nationality: "Netherlands", age: 21, position: "Defender", photo: "https://media.api-sports.io/football/players/161820.png", preferredFoot: "Right", height: 179, shirtNumber: 2 },
  { apiPlayerId: 161821, name: "Kenneth Taylor", team: "Ajax", league: "Eredivisie", nationality: "Netherlands", age: 22, position: "Midfielder", photo: "https://media.api-sports.io/football/players/161821.png", preferredFoot: "Both", height: 182, shirtNumber: 8 },
  { apiPlayerId: 161822, name: "Josip Šutalo", team: "Ajax", league: "Eredivisie", nationality: "Croatia", age: 24, position: "Defender", photo: "https://media.api-sports.io/football/players/161822.png", preferredFoot: "Right", height: 190, shirtNumber: 37 },
  { apiPlayerId: 295, name: "Jordan Henderson", team: "Ajax", league: "Eredivisie", nationality: "England", age: 34, position: "Midfielder", photo: "https://media.api-sports.io/football/players/295.png", preferredFoot: "Right", height: 182, shirtNumber: 6 },
  { apiPlayerId: 111, name: "Gerónimo Rulli", team: "Marseille", league: "Ligue 1", nationality: "Argentina", age: 32, position: "Goalkeeper", photo: "https://media.api-sports.io/football/players/111.png", preferredFoot: "Right", height: 189, shirtNumber: 12 }
];

// Map rich player details default generator for offline fallback properties
const enrichMissingDetails = (p) => {
  const pos = p.position || "Midfielder";
  const rand = Math.random();

  if (!p.appearances) p.appearances = Math.floor(Math.random() * 20) + 15;
  if (!p.goals && !p.assists) {
    if (pos === "Goalkeeper") {
      p.goals = 0;
      p.assists = rand > 0.95 ? 1 : 0;
    } else if (pos === "Defender") {
      p.goals = Math.floor(Math.random() * 3);
      p.assists = Math.floor(Math.random() * 5);
    } else if (pos === "Midfielder") {
      p.goals = Math.floor(Math.random() * 7) + 1;
      p.assists = Math.floor(Math.random() * 10) + 2;
    } else {
      p.goals = Math.floor(Math.random() * 16) + 5;
      p.assists = Math.floor(Math.random() * 8) + 1;
    }
  }
  if (!p.nationalTeam) p.nationalTeam = p.nationality;
  if (!p.marketValue) {
    const age = p.age || 26;
    const totalStats = (p.goals || 0) + (p.assists || 0);
    let baseVal = 12;
    if (pos === "Attacker") baseVal = 22 + totalStats * 3.5;
    else if (pos === "Midfielder") baseVal = 18 + totalStats * 3;
    else if (pos === "Defender") baseVal = 14 + totalStats * 2.5;
    else baseVal = 10 + p.appearances * 0.4;
    
    if (age < 23) baseVal *= 1.35;
    else if (age > 30) baseVal *= Math.max(0.25, 1 - (age - 30) * 0.12);
    
    p.marketValue = `€${Math.max(1, Math.round(baseVal))}M`;
  }
  
  const playStyles = {
    Goalkeeper: ["Sweeper Keeper", "Shot Stopper"],
    Defender: ["Ball-playing Defender", "Full-back", "Wing-back", "No-nonsense Center-back"],
    Midfielder: ["Box-to-Box Midfielder", "Deep-lying Playmaker", "Advanced Playmaker", "Ball-winning Midfielder"],
    Attacker: ["Inside Forward", "Target Man", "Poacher", "Winger"],
  };
  
  if (!p.playStyle) {
    const styles = playStyles[pos] || playStyles.Midfielder;
    p.playStyle = styles[Math.floor(Math.random() * styles.length)];
  }

  const roleDescriptions = {
    Goalkeeper: [
      "A reliable goalkeeper who excels at shot-stopping and dominating the penalty box.",
      "A modern sweeper-keeper known for building plays from the back and swift distributions."
    ],
    Defender: [
      "A towering defender who dominates aerial duels and organizes the backline with leadership.",
      "An energetic fullback who provides defensive solidity and overlaps to support the attack.",
      "A technical ball-playing center-back known for precise long passes and stepping into midfield."
    ],
    Midfielder: [
      "A tireless box-to-box engine who breaks up opponent attacks and drives forward into the box.",
      "A creative orchestrator with exceptional passing range and vision, controlling the match tempo.",
      "An attacking midfielder who excels in tight spaces, creating chances and arriving late to score."
    ],
    Attacker: [
      "A prolific striker with clinical finishing ability and exceptional movement off the ball.",
      "A tricky, rapid winger who excels in 1v1 situations, cutting inside to shoot or cross.",
      "An inside forward who uses speed and dribbling to breach defensive lines from wider positions."
    ]
  };

  if (!p.roleDescription) {
    const descs = roleDescriptions[pos] || roleDescriptions.Midfielder;
    p.roleDescription = descs[Math.floor(Math.random() * descs.length)];
  }

  return p;
};

// Seeding orchestrator
const importStars = async () => {
  let importedCount = 0;
  let updatedCount = 0;
  let missingCount = 0;

  try {
    console.log("Connecting to Database...");
    await connectDB();
    console.log("Connected.");

    // Remove duplicates from the local starPlayers array before seeding
    const uniqueStarPlayersMap = new Map();
    for (const p of starPlayers) {
      uniqueStarPlayersMap.set(p.apiPlayerId, p);
    }
    const uniqueStarPlayers = Array.from(uniqueStarPlayersMap.values());

    console.log(`Starting enrichment and upsert for ${uniqueStarPlayers.length} famous stars...`);
    const apiKey = process.env.API_FOOTBALL_KEY;

    for (let i = 0; i < uniqueStarPlayers.length; i++) {
      let legend = uniqueStarPlayers[i];
      let finalData = { ...legend };
      let apiSynced = false;

      // Check if player already exists in DB
      const exists = await Player.findOne({ apiPlayerId: legend.apiPlayerId });

      // If the player doesn't exist, we try to sync via API.
      // If the player DOES exist, we skip the API call and delay to optimize run time!
      if (!exists && apiKey && legend.apiPlayerId && legend.apiPlayerId < 900000) {
        try {
          console.log(`[API Sync] Fetching live data for: ${legend.name} (ID: ${legend.apiPlayerId})`);
          const response = await axios.get(`${API_FOOTBALL_BASE_URL}/players`, {
            headers: { "x-apisports-key": apiKey },
            params: { id: legend.apiPlayerId, season: "2023" }
          });

          const resData = response.data?.response?.[0];
          if (resData && resData.player) {
            const apiPlayer = resData.player;
            const apiStats = resData.statistics?.[0] || {};
            
            finalData.name = apiPlayer.name || legend.name;
            finalData.nationality = apiPlayer.nationality || legend.nationality;
            finalData.age = apiPlayer.age || legend.age;
            finalData.position = apiStats.games?.position || legend.position;
            finalData.team = apiStats.team?.name || legend.team;
            finalData.league = apiStats.league?.name || legend.league;
            finalData.photo = apiPlayer.photo || legend.photo;
            finalData.appearances = apiStats.games?.appearences || legend.appearances;
            finalData.goals = apiStats.goals?.total || legend.goals;
            finalData.assists = apiStats.goals?.assists || legend.assists;
            finalData.shirtNumber = apiStats.games?.number || legend.shirtNumber;
            if (apiPlayer.height) {
              const heightVal = parseFloat(apiPlayer.height.replace("cm", "").trim());
              if (!isNaN(heightVal)) finalData.height = heightVal;
            }
            apiSynced = true;
            console.log(`    Successfully synced live stats for ${legend.name}.`);
          }
        } catch (apiError) {
          console.warn(`    API sync failed for ${legend.name}: ${apiError.message}. Using offline fallback.`);
        }
        
        // Respect API rate limits (10 req/min for free plan, let's delay 6.2s between calls)
        await new Promise(resolve => setTimeout(resolve, 6200));
      } else if (exists) {
        console.log(`[Database Cache] Skipping API call for existing player: ${legend.name}`);
      }

      // Enforce rich fields calculations
      finalData = enrichMissingDetails(finalData);

      // Perform Mongoose Upsert
      try {
        await Player.findOneAndUpdate(
          { apiPlayerId: finalData.apiPlayerId },
          { $set: finalData },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        if (exists) {
          updatedCount++;
        } else {
          importedCount++;
        }
      } catch (dbError) {
        console.error(`    Failed to upsert player ${finalData.name}:`, dbError.message);
        missingCount++;
      }
    }

    // Verification checks after import
    console.log("\nEnforcing post-import existence checks...");
    let verifiedCount = 0;
    for (const p of uniqueStarPlayers) {
      const verified = await Player.findOne({ apiPlayerId: p.apiPlayerId });
      if (verified) {
        verifiedCount++;
      } else {
        console.warn(`    Verification failed: Player "${p.name}" (ID: ${p.apiPlayerId}) not found!`);
      }
    }

    console.log(`\n==================================================`);
    console.log(`STAR PLAYERS IMPORT COMPLETE`);
    console.log(`--------------------------------------------------`);
    console.log(` Curated List Size   : ${uniqueStarPlayers.length}`);
    console.log(` Imported (New)      : ${importedCount}`);
    console.log(` Updated (Enriched)  : ${updatedCount}`);
    console.log(` Missing             : ${missingCount}`);
    console.log(` Verified Database   : ${verifiedCount}/${uniqueStarPlayers.length} verified exist`);
    console.log(`==================================================\n`);

    process.exit(0);
  } catch (error) {
    console.error("Star import script crash:", error);
    process.exit(1);
  }
};

importStars();

# ⚽ Footkinator

Footkinator is an interactive, football-themed guessing game inspired by Akinator. Think of any football player, answer the questions, and the AI will predict who you have in mind!

The game is powered by a **State-Aware Reasoning Engine** that adaptively queries you based on your answers, handles player uncertainty, and learns from your feedback to make extremely precise guesses.

---

## 🌟 Key Features

### 1. State-Aware Reasoning Engine
- **Maximum Information Gain**: Dynamically computes entropy splits to select questions that divide candidates as close to 50/50 as possible.
- **Direct Contradiction & Redundancy Filtering**: Before a question is asked, it is validated against known facts (e.g. never asking Spanish nationality if the player is known to be English, or asking age <= 24 if they are known to be >= 30).
- **Attribute Novelty & Repetition Penalty**: Prevents looping on the same attributes (e.g. age or team) repeatedly by decaying attribute weights over turns.

### 2. "I Don't Know" (IDK) Uncertainty handling
- **Zero-weight Scoring**: Choosing "I Don't Know" does not penalize or eliminate candidates from the active pool, keeping matching players intact.
- **Confidence Decay**: Guessing confidence smoothly decays by 7% per unknown answer to reflect the lower precision of the dataset.
- **Dynamic Difficulty Adaptation**: Categorizes player properties into **Easy** (team, league, nationality), **Medium** (national team, goals, preferred foot), and **Hard** (height, shirt number, stats). If you answer "I Don't Know" frequently, the engine automatically shifts its focus to easier, high-level questions.

### 3. Data Integrity & Auto-Healing
- **Auditing Tool (`validatePlayers.js`)**: Validates the database for duplicate apiPlayerIds, duplicate names, missing properties, and invalid photo URLs.
- **Name/Photo Mismatches**: Checks name-photo-ID consistency. Heals star players (e.g. Mbappé, Neymar Jr, Messi, Ronaldo) by matching them to their real API profile details, and aligns mock players' photo URLs to their mock IDs.

### 4. Advanced Diagnostics
- **Debug Endpoint (`GET /game/debug/:gameId`)**: A dedicated diagnostic route revealing the total candidate count, top 10 candidates, candidate scores, known facts, and full question history.
- **Effectiveness Tracking**: Tracks the exact candidate pool size reduction (`beforeCandidateCount` and `afterCandidateCount`) for every question answered.

---

## 📁 Repository Structure

```text
Footkinator/
├── frontend/             # React + Vite client application
│   ├── src/
│   │   ├── components/   # UI elements (ProgressBar, PlayerCard, AnswerButtons)
│   │   ├── pages/        # Game pages (Home, Game Loop, Result screen)
│   │   └── services/     # API Axios client
│   └── package.json
│
├── backend/              # Express Node.js REST API
│   ├── ai/               # State-Aware reasoning logic & validators
│   ├── config/           # Database configurations
│   ├── game/             # Active game session manager
│   ├── models/           # Mongoose schemas (Player)
│   ├── routes/           # REST endpoints
│   ├── scripts/          # Fetching and validation scripts
│   └── package.json
│
├── README.md             # This document
└── .gitignore            # Centralized repository ignore file
```

---

## 🚀 Setup & Running Locally

### Prerequisites
- Node.js (v18+)
- MongoDB connection (local or MongoDB Atlas)
- API-Football key (optional, for fetching new squads)
- OpenAI API Key (optional, for LLM-based question generation fallback)

### 1. Configuration
In the `backend` folder, copy the example environment file and fill in your secrets:
```bash
cp backend/.env.example backend/.env
```
Update the connection strings:
```env
PORT=5001
MONGODB_URI=your_mongodb_connection_string
API_FOOTBALL_KEY=your_api_key
OPENAI_API_KEY=your_openai_key_if_used
```

### 2. Database Seeding & Validation
Run the validation script to clean, heal, and audit player data:
```bash
cd backend
npm run fetch:players   # Optional: fetches players from API
node scripts/validatePlayers.js # Audits and auto-heals DB records
```

### 3. Running the Game
Start both the backend server and frontend client.

#### Start Backend
```bash
cd backend
npm install
npm run dev     # Starts Nodemon watcher on port 5001
```

#### Start Frontend
```bash
cd frontend
npm install
npm run dev     # Starts Vite server (usually on http://localhost:5173 or 5174)
```

Open the Vite port URL in your browser and start playing!

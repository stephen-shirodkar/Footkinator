const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const healthRoutes = require("./routes/healthRoutes");
const playerRoutes = require("./routes/playerRoutes");
const aiRoutes = require("./routes/aiRoutes");
const gameRoutes = require("./routes/gameRoutes");
const { notFound, errorHandler } = require("./controllers/errorController");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

connectDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/", healthRoutes);
app.use("/players", playerRoutes);
app.use("/ai", aiRoutes);
app.use("/game", gameRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Footkinator backend running on port ${PORT}`);
});

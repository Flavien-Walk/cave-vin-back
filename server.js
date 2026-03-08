require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const bottleRoutes = require("./routes/bottles");
const wishlistRoutes = require("./routes/wishlist");
const statsRoutes = require("./routes/stats");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// latest.json
app.get("/latest.json", (req, res) => {
  res.sendFile(__dirname + "/latest.json");
});

// Routes
app.use("/api/bottles", bottleRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/stats", statsRoutes);

// Connexion MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connecte a MongoDB");
    app.listen(PORT, () => {
      console.log("Serveur en ligne sur http://localhost:" + PORT);
    });
  })
  .catch((err) => {
    console.error("Erreur de connexion a MongoDB :", err);
  });

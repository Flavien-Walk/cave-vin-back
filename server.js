require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const bottleRoutes = require("./routes/bottles");

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/bottles", bottleRoutes);

// Connexion à MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Connecté à MongoDB");
    app.listen(PORT, () => {
      console.log(`🚀 Serveur en ligne sur http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Erreur de connexion à MongoDB :", err);
  });

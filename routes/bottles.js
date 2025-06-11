const express = require("express");
const router = express.Router();
const Bottle = require("../models/Bottle");

// POST /api/bottles — Ajouter une bouteille
router.post("/", async (req, res) => {
  try {
    const newBottle = new Bottle(req.body);
    await newBottle.save();
    res.status(201).json({ message: "Bouteille ajoutée avec succès." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de l'ajout de la bouteille." });
  }
});

// GET /api/bottles — Liste des bouteilles (pour plus tard)
router.get("/", async (req, res) => {
  try {
    const bottles = await Bottle.find();
    res.json(bottles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la récupération des bouteilles." });
  }
});

module.exports = router;

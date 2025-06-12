// routes/bottles.js

const express = require("express");
const router = express.Router();
const Bottle = require("../models/Bottle");

// POST /api/bottles — Ajouter une bouteille
router.post("/", async (req, res) => {
  try {
    const {
      nom,
      producteur,
      region,
      appellation,
      annee,
      quantite,
      type,
      couleur,
      pays,
      prixAchat,
      consommerAvant,
      cave,
      emplacement,
    } = req.body;

    const newBottle = new Bottle({
      nom,
      producteur,
      region,
      appellation,
      annee,
      quantite,
      type,
      couleur,
      pays,
      prixAchat,
      consommerAvant,
      cave,
      emplacement,
    });

    await newBottle.save();
    res.status(201).json({ message: "Bouteille ajoutée avec succès.", bottle: newBottle });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de l'ajout de la bouteille." });
  }
});

// GET /api/bottles — Liste des bouteilles
router.get("/", async (req, res) => {
  try {
    const bottles = await Bottle.find();
    res.json(bottles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la récupération des bouteilles." });
  }
});

// PUT /api/bottles/:id — Mettre à jour une bouteille
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedBottle = await Bottle.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedBottle) {
      return res.status(404).json({ message: "Bouteille non trouvée." });
    }

    res.json({ message: "Bouteille mise à jour avec succès.", bottle: updatedBottle });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la mise à jour de la bouteille." });
  }
});

// DELETE /api/bottles/:id — Supprimer une bouteille
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deletedBottle = await Bottle.findByIdAndDelete(id);

    if (!deletedBottle) {
      return res.status(404).json({ message: "Bouteille non trouvée." });
    }

    res.json({ message: "Bouteille supprimée avec succès." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la suppression de la bouteille." });
  }
});

module.exports = router;

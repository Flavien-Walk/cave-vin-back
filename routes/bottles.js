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

// GET /api/bottles — Liste des bouteilles (avec notePerso)
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

// PUT /api/bottles/:id/note — Ajouter ou modifier la note/avis d'une bouteille
router.put("/:id/note", async (req, res) => {
  try {
    const { id } = req.params;
    const { texte, note } = req.body;

    if (!texte || typeof note !== "number") {
      return res.status(400).json({ message: "Le texte et la note sont obligatoires." });
    }

    const bottle = await Bottle.findById(id);
    if (!bottle) {
      return res.status(404).json({ message: "Bouteille non trouvée." });
    }

    bottle.notePerso = {
      texte,
      note,
      date: new Date()
    };

    await bottle.save();
    res.status(200).json({ message: "Note/avis enregistré.", notePerso: bottle.notePerso });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de l'ajout/modification de la note." });
  }
});

module.exports = router;

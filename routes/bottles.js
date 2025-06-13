const express = require("express");
const router = express.Router();
const Bottle = require("../models/Bottle");

function mostCommon(array) {
  if (!array.length) return null;
  const freq = {};
  let max = 0, result = null;
  array.forEach(v => {
    if (!v) return;
    freq[v] = (freq[v] || 0) + 1;
    if (freq[v] > max) { max = freq[v]; result = v; }
  });
  return result;
}

// POST /api/bottles — Ajouter une bouteille (toujours sur la cave unique)
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
      cave: "MaCavePerso",
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
    const bottles = await Bottle.find({ cave: "MaCavePerso" });
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

    const updatedBottle = await Bottle.findOneAndUpdate(
      { _id: id, cave: "MaCavePerso" },
      updateData,
      { new: true }
    );

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

    const deletedBottle = await Bottle.findOneAndDelete({ _id: id, cave: "MaCavePerso" });

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

    const bottle = await Bottle.findOne({ _id: id, cave: "MaCavePerso" });
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

// GET /api/bottles/recommend — Recommande des bouteilles à découvrir
router.get("/recommend", async (req, res) => {
  try {
    // Bouteilles de la cave unique
    const userBottles = await Bottle.find({ cave: "MaCavePerso" });
    if (!userBottles.length) return res.status(404).json({ message: "Aucune bouteille dans la cave." });

    const favorites = userBottles.filter(b => b.notePerso && b.notePerso.note >= 4);

    if (!favorites.length) {
      // Si aucun favori, recommander des best sellers, ou random (hors cave)
      const others = await Bottle.find({ cave: { $ne: "MaCavePerso" } }).limit(5);
      return res.json({ recommandations: others });
    }

    const colorPref = mostCommon(favorites.map(b => b.couleur));
    const typePref = mostCommon(favorites.map(b => b.type));
    const regionPref = mostCommon(favorites.map(b => b.region));

    const userBottleNames = userBottles.map(b => b.nom);
    const suggestions = await Bottle.find({
      cave: { $ne: "MaCavePerso" },
      $or: [
        { couleur: colorPref },
        { type: typePref },
        { region: regionPref },
      ],
      nom: { $nin: userBottleNames }
    }).limit(5);

    res.json({ recommandations: suggestions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur lors de la recommandation." });
  }
});

// POST /api/bottles/suggest-wine — Suggestion d'accord mets-vin pour un plat donné
router.post("/suggest-wine", async (req, res) => {
  try {
    const { plat } = req.body;
    if (!plat) return res.status(400).json({ message: "Plat requis." });

    const foodPairings = {
      poisson: ["Blanc sec", "Sauvignon", "Chardonnay"],
      viande_rouge: ["Rouge puissant", "Bordeaux", "Syrah"],
      fromage: ["Rouge léger", "Blanc aromatique", "Pinot Noir"],
      poulet: ["Chardonnay", "Viognier", "Rouge léger", "Beaujolais"],
      barbecue: ["Syrah", "Grenache", "Zinfandel"],
      dessert: ["Moelleux", "Sauternes", "Muscat"],
    };

    const platKey = Object.keys(foodPairings).find(key =>
      plat.toLowerCase().includes(key)
    );
    if (!platKey) return res.status(404).json({ message: "Plat non reconnu." });

    const vinTypes = foodPairings[platKey];
    const userBottles = await Bottle.find({ cave: "MaCavePerso" });

    const suggestions = userBottles.filter(b =>
      vinTypes.includes(b.type) ||
      vinTypes.includes(b.couleur) ||
      vinTypes.includes(b.appellation)
    );

    if (!suggestions.length) {
      return res.status(404).json({ message: "Aucun vin adapté trouvé dans votre cave." });
    }

    res.json({ suggestions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur lors de la suggestion d'accord mets-vin." });
  }
});

module.exports = router;

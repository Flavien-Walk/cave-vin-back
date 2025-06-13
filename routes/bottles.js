const express = require("express");
const router = express.Router();
const Bottle = require("../models/Bottle");

// -------- ALGO UTILS --------
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

// -------- CRUD CLASSIQUE --------

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

// GET /api/bottles — Liste des bouteilles (toutes, sans filtre)
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

// ----------- RECOMMANDATION (ALGO) -----------

// GET /api/bottles/recommend — Recommande des bouteilles à découvrir
router.get("/recommend", async (req, res) => {
  try {
    // On prend toutes les bouteilles de la BDD
    const allBottles = await Bottle.find();

    // On sélectionne les bouteilles notées >=4
    const favorites = allBottles.filter(b => b.notePerso && b.notePerso.note >= 4);

    if (!favorites.length) {
      // Si aucun favori, on recommande des bouteilles non notées par l'utilisateur (exemple simple)
      const notTasted = allBottles.filter(b => !b.notePerso);
      return res.json({ recommandations: notTasted.slice(0, 5) });
    }

    // Analyse des préférences de l'utilisateur
    const colorPref = mostCommon(favorites.map(b => b.couleur));
    const typePref = mostCommon(favorites.map(b => b.type));
    const regionPref = mostCommon(favorites.map(b => b.region));

    // On propose des bouteilles qu'il n'a pas encore notées,
    // mais qui correspondent à ses goûts principaux
    const alreadyTastedIds = favorites.map(b => String(b._id));
    const suggestions = allBottles.filter(b =>
      !alreadyTastedIds.includes(String(b._id)) &&
      (
        (colorPref && b.couleur === colorPref) ||
        (typePref && b.type === typePref) ||
        (regionPref && b.region === regionPref)
      )
    );

    // Si aucune suggestion sur le profil de goûts, on renvoie au moins des non notées
    if (suggestions.length === 0) {
      const notTasted = allBottles.filter(b => !b.notePerso);
      return res.json({ recommandations: notTasted.slice(0, 5) });
    }

    res.json({ recommandations: suggestions.slice(0, 5) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur lors de la recommandation." });
  }
});

// POST /api/bottles/suggest-wine — Suggestion d'accord mets-vin pour un plat donné
const removeAccents = (str) =>
  str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

router.post("/suggest-wine", async (req, res) => {
  try {
    let { plat } = req.body;
    if (!plat) return res.status(400).json({ message: "Plat requis." });
    plat = removeAccents(plat);

    // Table ultra-détaillée, chaque catégorie a ses synonymes & plats
    const foodPairings = [
      // --- Poissons & fruits de mer
      {
        keywords: [
          "poisson", "cabillaud", "saumon", "sole", "bar", "colin", "lotte",
          "merlu", "espadon", "dorade", "turbot", "anchois", "maquereau", "sardine", "truite",
          "fruits de mer", "fruit de mer", "huitre", "huitres", "crevette", "crevettes", "crabe",
          "crustace", "crustaces", "homard", "langouste", "coquillage", "coquillages", "bulot",
          "palourde", "palourdes", "praire", "praires", "coque", "coques", "oursin", "oursins", "tourteau", "moule", "moules", "calamar", "calamars", "seiche", "seiches", "encornet", "encornets", "poulpe", "poulpes", "pieuvre", "pieuvres"
        ],
        vins: ["Blanc sec", "Sauvignon", "Chablis", "Chardonnay", "Muscadet", "Picpoul", "Blanc", "Champagne"]
      },
      // --- Sushi & cuisine japonaise
      {
        keywords: [
          "sushi", "sashimi", "makis", "maki", "yakitori", "japonais", "cuisine japonaise", "chirashi"
        ],
        vins: ["Blanc sec", "Champagne", "Riesling", "Blanc aromatique"]
      },
      // --- Viandes rouges & gibiers
      {
        keywords: [
          "viande rouge", "boeuf", "bœuf", "steak", "entrecote", "entrecôte", "cote de boeuf", "côte de bœuf", "tournedos", "roti de boeuf", "magret", "agneau", "gibier", "cerf", "chevreuil", "sanglier", "canard", "bavette", "onglet", "rumsteck", "côtelette", "viande saignante", "gigue"
        ],
        vins: ["Rouge puissant", "Bordeaux", "Syrah", "Cabernet Sauvignon", "Côte-Rôtie", "Châteauneuf-du-Pape", "Rouge"]
      },
      // --- Viandes blanches & volailles
      {
        keywords: [
          "viande blanche", "poulet", "dinde", "veau", "lapin", "coq", "pintade", "blanc de poulet", "escalope", "volaille", "poulet rôti", "poulet grille", "vol au vent", "blanquette", "suprême de volaille"
        ],
        vins: ["Chardonnay", "Viognier", "Rouge léger", "Beaujolais", "Blanc", "Pinot Noir"]
      },
      // --- Porc & charcuteries
      {
        keywords: [
          "porc", "jambon", "charcuterie", "charcuteries", "saucisson", "paté", "pâté", "terrine", "rillettes", "boudin", "rosette", "coppa", "mortadelle", "andouille", "saucisse"
        ],
        vins: ["Beaujolais", "Gamay", "Rosé", "Rouge léger", "Côtes-du-Rhône", "Pinot Noir"]
      },
      // --- Pâtes, pizzas, lasagnes
      {
        keywords: [
          "pates", "pâtes", "spaghetti", "penne", "tagliatelle", "lasagne", "lasagnes", "pizza", "pizzas", "cannelloni", "gnocchi", "ravioli", "tortellini"
        ],
        vins: ["Rouge italien", "Chianti", "Sangiovese", "Barbera", "Nero d'Avola", "Lambrusco", "Rosé", "Rouge", "Blanc"]
      },
      // --- Plats épicés, curry, cuisine indienne/asiatique
      {
        keywords: [
          "curry", "curry vert", "curry rouge", "massaman", "thai", "thaï", "thai food", "cuisine indienne", "tandoori", "vindaloo", "samosa", "pakora", "nem", "nems", "wok", "asiatique", "pad thai", "pad thaï"
        ],
        vins: ["Blanc aromatique", "Riesling", "Gewurztraminer", "Rosé", "Vouvray", "Chenin", "Blanc doux"]
      },
      // --- Légumes, plats végétariens, quiche, gratin, risotto
      {
        keywords: [
          "legume", "légume", "gratin", "tian", "flan", "risotto", "courgette", "aubergine", "tomate", "poivron", "ratatouille", "poireau", "fenouil", "asperge", "champignon", "salade", "taboulé", "taboule", "crudités", "crudite", "tarte salee", "tarte salée", "quiche", "omelette", "tofu", "seitan", "végétarien", "vegetarien", "vegane", "vegan", "falafel", "pomme de terre"
        ],
        vins: ["Rosé", "Blanc sec", "Chardonnay", "Pinot Gris", "Rouge léger", "Beaujolais", "Blanc"]
      },
      // --- Fromages (variétés les plus courantes)
      {
        keywords: [
          "fromage", "camembert", "brie", "roquefort", "comte", "comté", "chevre", "chèvre", "bleu", "reblochon", "emmental", "tomme", "munster", "cantal", "raclette", "fondue"
        ],
        vins: ["Rouge léger", "Blanc aromatique", "Pinot Noir", "Blanc", "Rouge", "Gewurztraminer", "Sauternes", "Mondeuse"]
      },
      // --- Plats de fêtes, foie gras
      {
        keywords: [
          "foie gras", "saumon fume", "saumon fumé", "homard", "noel", "noël", "fete", "fête"
        ],
        vins: ["Sauternes", "Champagne", "Monbazillac", "Blanc doux", "Gewurztraminer"]
      },
      // --- Plats du monde (tajine, couscous, paella...)
      {
        keywords: [
          "tajine", "couscous", "paella", "cassoulet", "pot au feu", "choucroute", "saucisse lentilles", "bourguignon", "blanquette"
        ],
        vins: ["Rouge", "Côtes-du-Rhône", "Rosé", "Chardonnay", "Pinot Noir", "Syrah"]
      },
      // --- Entrées froides, terrines, oeufs, tapas
      {
        keywords: [
          "entree", "entrée", "oeuf", "oeufs", "tapas", "gaspacho", "salade composee", "salade composée", "rillettes", "paté", "pâté", "terrine", "mousse"
        ],
        vins: ["Rosé", "Blanc sec", "Beaujolais", "Crémant", "Champagne"]
      },
      // --- Desserts (chocolat, fruits, tartes, glaces)
      {
        keywords: [
          "dessert", "gateau", "gâteau", "tarte", "glace", "sorbet", "mousse au chocolat", "tiramisu", "crumble", "macaron", "brownie", "chocolat", "clafoutis", "panna cotta", "creme brulee", "crème brûlée", "fruit", "fruits", "fraise", "framboise", "poire", "pomme", "abricot", "ananas", "mangue", "coulis"
        ],
        vins: ["Moelleux", "Sauternes", "Muscat", "Blanc doux", "Monbazillac", "Champagne"]
      },
    ];

    // Trouver la catégorie correspondante
    const foundPairing = foodPairings.find(pair =>
      pair.keywords.some(key => plat.includes(removeAccents(key)))
    );

    if (!foundPairing) {
      return res.status(404).json({ message: "Plat non reconnu. Essayez d'être plus précis ou testez un autre plat !" });
    }

    const allBottles = await Bottle.find();

    const suggestions = allBottles.filter(b =>
      foundPairing.vins.includes(b.type) ||
      foundPairing.vins.includes(b.couleur) ||
      foundPairing.vins.includes(b.appellation)
    );

    if (!suggestions.length) {
      return res.status(404).json({ message: "Aucun vin adapté trouvé dans votre cave." });
    }

    res.json({ suggestions: suggestions.slice(0, 5) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur lors de la suggestion d'accord mets-vin." });
  }
});


module.exports = router;

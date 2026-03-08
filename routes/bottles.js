const express = require("express");
const router = express.Router();
const Bottle = require("../models/Bottle");
const ConsumptionEntry = require("../models/ConsumptionEntry");

function mostCommon(array) {
  if (!array.length) return null;
  const freq = {};
  let max = 0, result = null;
  array.forEach((v) => {
    if (!v) return;
    freq[v] = (freq[v] || 0) + 1;
    if (freq[v] > max) { max = freq[v]; result = v; }
  });
  return result;
}

const removeAccents = (str) =>
  str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

// ── CRUD ──────────────────────────────────────

router.get("/", async (req, res) => {
  try {
    const bottles = await Bottle.find().sort({ createdAt: -1 });
    res.json(bottles);
  } catch (err) { res.status(500).json({ message: "Erreur." }); }
});

router.get("/:id", async (req, res) => {
  try {
    const bottle = await Bottle.findById(req.params.id);
    if (!bottle) return res.status(404).json({ message: "Bouteille non trouvee." });
    res.json(bottle);
  } catch (err) { res.status(500).json({ message: "Erreur." }); }
});

router.post("/", async (req, res) => {
  try {
    const bottle = new Bottle(req.body);
    await bottle.save();
    res.status(201).json({ message: "Bouteille ajoutee.", bottle });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur ajout." });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const bottle = await Bottle.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!bottle) return res.status(404).json({ message: "Bouteille non trouvee." });
    res.json({ message: "Bouteille mise a jour.", bottle });
  } catch (err) { res.status(500).json({ message: "Erreur." }); }
});

router.delete("/:id", async (req, res) => {
  try {
    const bottle = await Bottle.findByIdAndDelete(req.params.id);
    if (!bottle) return res.status(404).json({ message: "Bouteille non trouvee." });
    await ConsumptionEntry.deleteMany({ bottleId: req.params.id });
    res.json({ message: "Bouteille supprimee." });
  } catch (err) { res.status(500).json({ message: "Erreur." }); }
});

// ── FAVORIS ───────────────────────────────────

router.put("/:id/favorite", async (req, res) => {
  try {
    const bottle = await Bottle.findById(req.params.id);
    if (!bottle) return res.status(404).json({ message: "Bouteille non trouvee." });
    bottle.isFavorite = !bottle.isFavorite;
    await bottle.save();
    res.json({ isFavorite: bottle.isFavorite });
  } catch (err) { res.status(500).json({ message: "Erreur toggle favori." }); }
});

// ── NOTES ─────────────────────────────────────

router.post("/:id/notes", async (req, res) => {
  try {
    const { note, texte, occasion } = req.body;
    if (!note || typeof note !== "number") return res.status(400).json({ message: "Note obligatoire." });
    const bottle = await Bottle.findById(req.params.id);
    if (!bottle) return res.status(404).json({ message: "Bouteille non trouvee." });
    bottle.notes.push({ note, texte, occasion });
    await bottle.save();
    res.status(201).json({ message: "Note ajoutee.", notes: bottle.notes });
  } catch (err) { res.status(500).json({ message: "Erreur." }); }
});

router.delete("/:id/notes/:noteId", async (req, res) => {
  try {
    const bottle = await Bottle.findById(req.params.id);
    if (!bottle) return res.status(404).json({ message: "Bouteille non trouvee." });
    bottle.notes = bottle.notes.filter((n) => String(n._id) !== req.params.noteId);
    await bottle.save();
    res.json({ message: "Note supprimee.", notes: bottle.notes });
  } catch (err) { res.status(500).json({ message: "Erreur." }); }
});

// Retrocompatibilite
router.put("/:id/note", async (req, res) => {
  try {
    const { texte, note } = req.body;
    if (!texte || typeof note !== "number") return res.status(400).json({ message: "Texte et note obligatoires." });
    const bottle = await Bottle.findById(req.params.id);
    if (!bottle) return res.status(404).json({ message: "Bouteille non trouvee." });
    bottle.notePerso = { texte, note, date: new Date() };
    await bottle.save();
    res.json({ message: "Note enregistree.", notePerso: bottle.notePerso });
  } catch (err) { res.status(500).json({ message: "Erreur." }); }
});

// ── CONSOMMATION ──────────────────────────────

router.post("/:id/drink", async (req, res) => {
  try {
    const { quantity = 1, note, comment, occasion } = req.body;
    const bottle = await Bottle.findById(req.params.id);
    if (!bottle) return res.status(404).json({ message: "Bouteille non trouvee." });
    if (bottle.quantite < quantity) return res.status(400).json({ message: "Quantite insuffisante." });
    bottle.quantite -= quantity;
    await bottle.save();
    const entry = new ConsumptionEntry({ bottleId: bottle._id, quantity, note, comment, occasion });
    await entry.save();
    res.status(201).json({ message: "Consommation enregistree.", entry, quantiteRestante: bottle.quantite });
  } catch (err) { res.status(500).json({ message: "Erreur." }); }
});

router.get("/:id/history", async (req, res) => {
  try {
    const entries = await ConsumptionEntry.find({ bottleId: req.params.id }).sort({ date: -1 });
    res.json(entries);
  } catch (err) { res.status(500).json({ message: "Erreur." }); }
});

// ── RECOMMANDATIONS ───────────────────────────

router.get("/recommend", async (req, res) => {
  try {
    const allBottles = await Bottle.find();
    const favorites = allBottles.filter(
      (b) => b.isFavorite || (b.notePerso && b.notePerso.note >= 4) || b.notes.some((n) => n.note >= 4)
    );
    if (!favorites.length) {
      return res.json({ recommandations: allBottles.filter((b) => !b.notePerso && !b.notes.length).slice(0, 5) });
    }
    const colorPref = mostCommon(favorites.map((b) => b.couleur));
    const regionPref = mostCommon(favorites.map((b) => b.region));
    const alreadyIds = favorites.map((b) => String(b._id));
    const suggestions = allBottles.filter(
      (b) => !alreadyIds.includes(String(b._id)) && ((colorPref && b.couleur === colorPref) || (regionPref && b.region === regionPref))
    );
    res.json({
      recommandations: suggestions.length
        ? suggestions.slice(0, 5)
        : allBottles.filter((b) => !b.notePerso && !b.notes.length).slice(0, 5),
    });
  } catch (err) { res.status(500).json({ message: "Erreur recommandation." }); }
});

router.post("/suggest-wine", async (req, res) => {
  try {
    let { plat } = req.body;
    if (!plat) return res.status(400).json({ message: "Plat requis." });
    plat = removeAccents(plat);
    const foodPairings = [
      { keywords: ["poisson","cabillaud","saumon","sole","bar","truite","dorade","turbot","maquereau","sardine","fruits de mer","huitre","crevette","crabe","homard","moule","calamar","poulpe"], vins: ["blanc","rose","effervescent"] },
      { keywords: ["sushi","sashimi","makis","yakitori","japonais"], vins: ["blanc","effervescent"] },
      { keywords: ["boeuf","steak","entrecote","agneau","gibier","cerf","chevreuil","sanglier","canard","bavette","magret"], vins: ["rouge"] },
      { keywords: ["poulet","dinde","veau","lapin","pintade","volaille","escalope","blanquette"], vins: ["blanc","rouge"] },
      { keywords: ["porc","jambon","charcuterie","saucisson","terrine","rillettes","boudin"], vins: ["rouge","rose"] },
      { keywords: ["pates","spaghetti","lasagne","pizza","gnocchi","ravioli"], vins: ["rouge","blanc"] },
      { keywords: ["curry","thai","indien","tandoori","wok","asiatique","nem"], vins: ["blanc","rose"] },
      { keywords: ["legume","gratin","risotto","courgette","aubergine","tomate","ratatouille","salade","quiche","omelette","tofu","vegetarien","vegan","falafel"], vins: ["rose","blanc"] },
      { keywords: ["fromage","camembert","brie","roquefort","comte","chevre","bleu","raclette","fondue"], vins: ["rouge","blanc"] },
      { keywords: ["foie gras","saumon fume","noel","fete"], vins: ["moelleux","effervescent"] },
      { keywords: ["tajine","couscous","paella","cassoulet","bourguignon"], vins: ["rouge","rose"] },
      { keywords: ["dessert","gateau","tarte","glace","chocolat","tiramisu","mousse","macaron","fruit"], vins: ["moelleux","effervescent"] },
    ];
    const found = foodPairings.find((pair) => pair.keywords.some((k) => plat.includes(removeAccents(k))));
    if (!found) return res.status(404).json({ message: "Plat non reconnu." });
    const allBottles = await Bottle.find();
    const suggestions = allBottles.filter((b) => found.vins.some((v) => removeAccents(b.couleur || "") === removeAccents(v)));
    if (!suggestions.length) return res.status(404).json({ message: "Aucun vin adapte trouve." });
    res.json({ suggestions: suggestions.slice(0, 5) });
  } catch (err) { res.status(500).json({ message: "Erreur suggestion." }); }
});

module.exports = router;

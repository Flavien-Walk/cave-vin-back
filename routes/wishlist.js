const express = require("express");
const router = express.Router();
const Wishlist = require("../models/Wishlist");

// GET /api/wishlist
router.get("/", async (req, res) => {
  try {
    const items = await Wishlist.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) { res.status(500).json({ message: "Erreur." }); }
});

// POST /api/wishlist
router.post("/", async (req, res) => {
  try {
    const item = new Wishlist(req.body);
    await item.save();
    res.status(201).json({ message: "Ajout a la wishlist.", item });
  } catch (err) { res.status(500).json({ message: "Erreur ajout." }); }
});

// PUT /api/wishlist/:id
router.put("/:id", async (req, res) => {
  try {
    const item = await Wishlist.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ message: "Element non trouve." });
    res.json({ message: "Mise a jour.", item });
  } catch (err) { res.status(500).json({ message: "Erreur." }); }
});

// DELETE /api/wishlist/:id
router.delete("/:id", async (req, res) => {
  try {
    const item = await Wishlist.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: "Element non trouve." });
    res.json({ message: "Supprime." });
  } catch (err) { res.status(500).json({ message: "Erreur." }); }
});

// PUT /api/wishlist/:id/purchase — marquer comme achete
router.put("/:id/purchase", async (req, res) => {
  try {
    const item = await Wishlist.findByIdAndUpdate(
      req.params.id,
      { isPurchased: true },
      { new: true }
    );
    if (!item) return res.status(404).json({ message: "Element non trouve." });
    res.json({ message: "Marque comme achete.", item });
  } catch (err) { res.status(500).json({ message: "Erreur." }); }
});

module.exports = router;

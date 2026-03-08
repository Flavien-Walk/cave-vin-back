const express = require("express");
const router = express.Router();
const Bottle = require("../models/Bottle");
const ConsumptionEntry = require("../models/ConsumptionEntry");

// GET /api/stats/summary
router.get("/summary", async (req, res) => {
  try {
    const bottles = await Bottle.find();
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    // Totaux
    const totalBottles = bottles.reduce((sum, b) => sum + (b.quantite || 0), 0);
    const totalValue = bottles.reduce((sum, b) => sum + ((b.prixAchat || 0) * (b.quantite || 0)), 0);
    const totalReferences = bottles.length;

    // Repartition couleur
    const colorMap = {};
    bottles.forEach((b) => {
      if (!b.couleur) return;
      colorMap[b.couleur] = (colorMap[b.couleur] || 0) + (b.quantite || 0);
    });
    const byColor = Object.entries(colorMap).map(([couleur, count]) => ({
      couleur,
      count,
      percentage: totalBottles > 0 ? Math.round((count / totalBottles) * 100) : 0,
    })).sort((a, b) => b.count - a.count);

    // Repartition region
    const regionMap = {};
    bottles.forEach((b) => {
      if (!b.region) return;
      regionMap[b.region] = (regionMap[b.region] || 0) + (b.quantite || 0);
    });
    const byRegion = Object.entries(regionMap)
      .map(([region, count]) => ({ region, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Repartition annee
    const yearMap = {};
    bottles.forEach((b) => {
      if (!b.annee) return;
      yearMap[b.annee] = (yearMap[b.annee] || 0) + (b.quantite || 0);
    });
    const byYear = Object.entries(yearMap)
      .map(([annee, count]) => ({ annee: parseInt(annee), count }))
      .sort((a, b) => a.annee - b.annee);

    // Bouteilles urgentes
    const urgent = bottles.filter(
      (b) => b.consommerAvant && b.consommerAvant <= currentYear && b.quantite > 0
    ).length;

    // Favoris
    const favorites = bottles.filter((b) => b.isFavorite).length;

    // Consommation
    const allEntries = await ConsumptionEntry.find();
    const thisMonthStart = new Date(currentYear, currentMonth, 1);
    const thisYearStart = new Date(currentYear, 0, 1);

    const consumedThisMonth = allEntries
      .filter((e) => new Date(e.date) >= thisMonthStart)
      .reduce((sum, e) => sum + e.quantity, 0);

    const consumedThisYear = allEntries
      .filter((e) => new Date(e.date) >= thisYearStart)
      .reduce((sum, e) => sum + e.quantity, 0);

    const consumedTotal = allEntries.reduce((sum, e) => sum + e.quantity, 0);

    res.json({
      totalBottles,
      totalValue: Math.round(totalValue * 100) / 100,
      totalReferences,
      byColor,
      byRegion,
      byYear,
      urgent,
      favorites,
      consumed: {
        thisMonth: consumedThisMonth,
        thisYear: consumedThisYear,
        total: consumedTotal,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur stats." });
  }
});

module.exports = router;

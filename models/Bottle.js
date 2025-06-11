const mongoose = require("mongoose");

const bottleSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  annee: { type: String },
  quantite: { type: Number, required: true }, // Ajout de la quantité
  type: { type: String },
  couleur: { type: String },
  pays: { type: String },
  cave: { type: String },
  emplacement: { type: String },
});

module.exports = mongoose.model("Bottle", bottleSchema);

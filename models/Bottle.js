const mongoose = require("mongoose");

const bottleSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  annee: { type: String },
  quantite: { type: Number, required: true }, // Quantité obligatoire
  type: { type: String },
  couleur: { type: String },
  pays: { type: String },
  cave: { type: String },
  emplacement: { type: String },
}, {
  timestamps: true // Pour createdAt et updatedAt
});

module.exports = mongoose.model("Bottle", bottleSchema);

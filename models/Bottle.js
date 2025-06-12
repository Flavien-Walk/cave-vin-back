const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema({
  texte: { type: String, required: true },
  note: { type: Number, min: 1, max: 5, required: true },
  date: { type: Date, default: Date.now }
});

const bottleSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  producteur: { type: String },
  region: { type: String },
  appellation: { type: String },
  annee: { type: String },
  quantite: { type: Number, required: true },
  type: { type: String },
  couleur: { type: String },
  pays: { type: String },
  prixAchat: { type: Number },
  consommerAvant: { type: String },
  cave: { type: String },
  emplacement: { type: String },
  notePerso: noteSchema // Remplace commentaires par une seule note personnelle
}, {
  timestamps: true
});

module.exports = mongoose.model("Bottle", bottleSchema);

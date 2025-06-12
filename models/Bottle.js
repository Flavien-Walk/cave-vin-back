// models/Bottle.js

const mongoose = require("mongoose");

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
}, {
  timestamps: true
});

module.exports = mongoose.model("Bottle", bottleSchema);

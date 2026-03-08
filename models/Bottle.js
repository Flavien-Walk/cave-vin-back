const mongoose = require("mongoose");

const tastingNoteSchema = new mongoose.Schema({
  note: { type: Number, min: 1, max: 5, required: true },
  texte: { type: String },
  occasion: { type: String },
  date: { type: Date, default: Date.now },
});

const bottleSchema = new mongoose.Schema(
  {
    // Identité du vin
    nom: { type: String, required: true },
    producteur: { type: String },
    region: { type: String },
    appellation: { type: String },
    annee: { type: Number },
    couleur: {
      type: String,
      enum: ["rouge", "blanc", "rosé", "effervescent", "moelleux", "autre"],
    },
    type: {
      type: String,
      enum: ["bouteille", "demi", "magnum", "jéroboam", "autre"],
      default: "bouteille",
    },
    pays: { type: String },

    // Cave
    quantite: { type: Number, required: true, default: 1 },
    cave: { type: String },
    emplacement: { type: String },

    // Financier
    prixAchat: { type: Number },

    // Consommation
    consommerAvant: { type: Number },
    consommerApresOptimal: { type: Number },

    // Médias
    photoUrl: { type: String },
    photoThumbUrl: { type: String },

    // Social
    isFavorite: { type: Boolean, default: false },

    // Notes de dégustation (plusieurs par bouteille)
    notes: [tastingNoteSchema],

    // Rétrocompatibilité — ancienne note unique
    notePerso: {
      texte: { type: String },
      note: { type: Number, min: 1, max: 5 },
      date: { type: Date },
    },

    // Metadata
    source: {
      type: String,
      enum: ["manual", "scan", "import"],
      default: "manual",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Bottle", bottleSchema);

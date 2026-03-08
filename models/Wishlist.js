const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema(
  {
    nom: { type: String, required: true },
    producteur: { type: String },
    region: { type: String },
    appellation: { type: String },
    annee: { type: Number },
    couleur: { type: String },
    priorite: {
      type: String,
      enum: ["haute", "normale", "basse"],
      default: "normale",
    },
    prixCible: { type: Number },
    note: { type: String },
    url: { type: String },
    isPurchased: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Wishlist", wishlistSchema);

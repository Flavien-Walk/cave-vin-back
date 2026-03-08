const mongoose = require("mongoose");

const consumptionEntrySchema = new mongoose.Schema(
  {
    bottleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bottle",
      required: true,
    },
    quantity: { type: Number, default: 1, min: 1 },
    date: { type: Date, default: Date.now },
    note: { type: Number, min: 1, max: 5 },
    comment: { type: String },
    occasion: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ConsumptionEntry", consumptionEntrySchema);

// models/HistoricalPrice.js
const mongoose = require("mongoose");

const historicalPriceSchema = new mongoose.Schema(
  {
    crop: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    district: {
      type: String,
      required: true,
      default: "Varanasi",
      index: true,
    },
    state: {
      type: String,
      default: "Uttar Pradesh",
    },
    market: {
      type: String,
      default: "Varanasi Mandi",
    },
    variety: {
      type: String, // e.g., "Basmati", "IR-64"
    },
    unit: {
      type: String,
      default: "quintal",
    },
    source: {
      type: String,
      default: "manual", // 'manual', 'agmarknet', 'api', etc.
    },
  },
  {
    timestamps: true,
    // Compound index for unique entries
    indexes: [{ crop: 1, district: 1, date: 1 }],
  },
);

// Prevent duplicate entries for same crop, district, and date
historicalPriceSchema.index(
  { crop: 1, district: 1, date: 1 },
  { unique: true },
);

module.exports = mongoose.model("HistoricalPrice", historicalPriceSchema);

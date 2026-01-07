const mongoose = require("mongoose");

const requirementOfferSchema = new mongoose.Schema(
  {
    // --- 1. LINKING FIELDS ---
    requirement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BuyerRequirement",
      required: true,
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Buyer",
      required: true,
    },
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Farmer",
      required: true,
    },

    // --- 2. OFFER TERMS ---
    pricePerUnit: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    availableDate: {
      type: Date,
      required: true,
    },
    message: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    // --- 3. STATUS ---
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RequirementOffer", requirementOfferSchema);

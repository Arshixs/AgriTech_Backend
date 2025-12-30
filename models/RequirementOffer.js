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
      type: Number, // The price the Farmer wants (might differ from Buyer's target)
      required: true,
    },
    quantity: {
      type: Number, // The amount the Farmer can supply
      required: true,
    },
    availableDate: {
      type: Date, // When the crop will be ready for delivery/pickup
      required: true,
    },

    // --- 3. STATUS ---
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RequirementOffer", requirementOfferSchema);

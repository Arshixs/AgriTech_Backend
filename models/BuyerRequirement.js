const mongoose = require("mongoose");

const buyerRequirementSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Buyer",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    category: {
      type: String,
      // Restricted to harvest/produce categories only
      enum: ["crops", "grains", "vegetables", "fruits", "flowers", "spices"],
      required: true,
      default: "crops",
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      required: true, // e.g., 'tons', 'quintal', 'kg'
      trim: true,
    },
    targetPrice: {
      type: Number, // Optional: Buyer can say "I want to buy at ₹20/kg"
      min: 0,
    },
    status: {
      type: String,
      enum: ["active", "fulfilled", "cancelled"],
      default: "active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BuyerRequirement", buyerRequirementSchema);

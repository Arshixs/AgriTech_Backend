const mongoose = require("mongoose");

const buyerRequirementSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Buyer",
      required: true,
      index: true,
    },

    // --- 1. CORE CROP DETAILS ---
    cropName: {
      type: String,
      required: true,
      trim: true,
      index: true, // Indexed for search
    },
    category: {
      type: String,
      enum: ["crops", "grains", "vegetables", "fruits", "flowers", "spices"],
      required: true,
    },
    variety: {
      type: String, // e.g., "Basmati" for Rice, "Nagpur" for Oranges
      trim: true,
    },

    // --- 2. QUANTITY & PRICE ---
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unit: {
      type: String,
      required: true,
    },
    targetPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    isNegotiable: {
      type: Boolean,
      default: true,
    },

    // --- 3. TIME & CONTRACT SPECIFICS (CRITICAL FOR PRE-HARVEST) ---
    contractType: {
      type: String,
      enum: ["spot_market", "pre_harvest_contract"],
      required: true,
      default: "pre_harvest_contract",
    },
    requiredByDate: {
      type: Date,
      required: true, // The "Deadline" or "Harvest Window"
    },
    listingExpiresAt: {
      type: Date,
      // Automatically hide this requirement if date passes
    },

    // --- 4. QUALITY & LOGISTICS ---
    qualityGrade: {
      type: String,
      enum: ["A", "B", "C", "Export", "Organic", "Any"],
      default: "Any",
    },
    description: {
      type: String, // Specifics like "Moisture content < 12%"
      maxlength: 500,
    },

    // Logistics
    deliveryLocation: {
      address: String,
      city: String,
      state: String,
      pinCode: String,
      coordinates: {
        // Optional: for map view
        lat: Number,
        lng: Number,
      },
    },
    logisticsType: {
      type: String,
      enum: ["buyer_pick_up", "farmer_delivery"],
      default: "buyer_pick_up",
    },

    // --- 5. STATUS & METRICS ---
    status: {
      type: String,
      enum: ["active", "fulfilled", "expired", "cancelled"],
      default: "active",
      index: true,
    },
    totalOffersReceived: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Middleware to auto-expire listings
buyerRequirementSchema.pre("save", async function () {
  if (!this.listingExpiresAt && this.requiredByDate) {
    this.listingExpiresAt = this.requiredByDate;
  }
});

module.exports = mongoose.model("BuyerRequirement", buyerRequirementSchema);

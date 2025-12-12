const mongoose = require("mongoose");

const bidSchema = new mongoose.Schema(
  {
    saleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sale",
      required: true,
      index: true,
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Buyer",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    bidTime: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["active", "won", "lost", "outbid"],
      default: "active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Bid", bidSchema);

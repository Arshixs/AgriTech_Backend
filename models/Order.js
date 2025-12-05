const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  // --- 1. PARTICIPANTS ---
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Buyer",
    required: true,
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vendor",
    required: true,
  },

  // --- 2. PRODUCT DETAILS ---
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "VendorProduct",
    required: true,
  },
  productSnapshot: {
    // We save a snapshot (name, price) just in case the vendor changes/deletes the product later
    name: String,
    price: Number,
    unit: String,
  },

  // --- 3. ORDER TYPE SPECIFICS ---
  orderType: {
    type: String,
    enum: ["purchase", "rental"],
    required: true,
  },
  
  // For Purchases:
  quantity: { 
    type: Number, 
    default: 1 
  },

  // For Rentals:
  rentalDuration: {
    startDate: Date,
    endDate: Date,
    totalDays: Number,
  },

  // --- 4. FINANCIALS ---
  totalAmount: {
    type: Number,
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "cod"], // COD = Cash on Delivery
    default: "pending",
  },

  // --- 5. STATUS WORKFLOW ---
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected", "completed", "cancelled"],
    default: "pending",
  },
  
  rejectionReason: { type: String } // Optional: If vendor rejects, they can say why

}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
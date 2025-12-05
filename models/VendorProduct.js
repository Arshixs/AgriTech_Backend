const mongoose = require("mongoose");
const Vendor = require("./Vendor");

const vendorProductSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: Vendor,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      trim: true,
      min: 0,
    },
    stock: {
      type: Number,
      required: true,
      trim: true,
      min: 0,
      default: 0,
    },
    unit: {
      // kg ton unit etc
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    category: {
      type: String,
      enum: ["seeds", "tools", "machines", "agri-inputs", "rentals"],
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("VendorProduct", vendorProductSchema);

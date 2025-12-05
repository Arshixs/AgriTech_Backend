// File: scripts/seedMSP.js

require("dotenv").config();
const mongoose = require("mongoose");
const MSP = require("../models/MSP");

// Real MSP data for major crops in India (2024-25)
const mspData = [
  // Kharif Crops
  {
    cropName: "Paddy (Common)",
    price: 2300,
    unit: "quintal",
    season: "kharif",
  },
  {
    cropName: "Paddy (Grade A)",
    price: 2320,
    unit: "quintal",
    season: "kharif",
  },
  {
    cropName: "Jowar (Hybrid)",
    price: 3180,
    unit: "quintal",
    season: "kharif",
  },
  {
    cropName: "Jowar (Maldandi)",
    price: 3225,
    unit: "quintal",
    season: "kharif",
  },
  { cropName: "Bajra", price: 2500, unit: "quintal", season: "kharif" },
  { cropName: "Maize", price: 2090, unit: "quintal", season: "kharif" },
  { cropName: "Ragi", price: 3846, unit: "quintal", season: "kharif" },
  { cropName: "Arhar (Tur)", price: 7000, unit: "quintal", season: "kharif" },
  { cropName: "Moong", price: 8558, unit: "quintal", season: "kharif" },
  { cropName: "Urad", price: 6950, unit: "quintal", season: "kharif" },
  {
    cropName: "Cotton (Medium Staple)",
    price: 7020,
    unit: "quintal",
    season: "kharif",
  },
  {
    cropName: "Cotton (Long Staple)",
    price: 7521,
    unit: "quintal",
    season: "kharif",
  },
  { cropName: "Groundnut", price: 6377, unit: "quintal", season: "kharif" },
  {
    cropName: "Soyabean (Yellow)",
    price: 4600,
    unit: "quintal",
    season: "kharif",
  },
  {
    cropName: "Sunflower Seed",
    price: 6760,
    unit: "quintal",
    season: "kharif",
  },
  { cropName: "Sesamum", price: 7830, unit: "quintal", season: "kharif" },
  { cropName: "Niger Seed", price: 7734, unit: "quintal", season: "kharif" },

  // Rabi Crops
  { cropName: "Wheat", price: 2275, unit: "quintal", season: "rabi" },
  { cropName: "Barley", price: 1850, unit: "quintal", season: "rabi" },
  { cropName: "Gram", price: 5440, unit: "quintal", season: "rabi" },
  { cropName: "Masur (Lentil)", price: 6700, unit: "quintal", season: "rabi" },
  {
    cropName: "Rapeseed/Mustard",
    price: 5650,
    unit: "quintal",
    season: "rabi",
  },
  { cropName: "Safflower", price: 5800, unit: "quintal", season: "rabi" },
  { cropName: "Toria", price: 5450, unit: "quintal", season: "rabi" },

  // Other Commercial Crops
  { cropName: "Sugarcane", price: 340, unit: "quintal", season: "year-round" },
  {
    cropName: "Copra (Coconut)",
    price: 11000,
    unit: "quintal",
    season: "year-round",
  },
  {
    cropName: "De-husked Coconut",
    price: 7525,
    unit: "quintal",
    season: "year-round",
  },
  { cropName: "Jute", price: 5050, unit: "quintal", season: "year-round" },
];

const seedMSP = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");

    // Clear existing MSP data
    await MSP.deleteMany({});
    console.log("Cleared existing MSP data");

    // Insert new MSP data
    const result = await MSP.insertMany(mspData);
    console.log(`✅ Successfully seeded ${result.length} MSP entries`);

    // Display the data
    console.log("\n📊 MSP Data:");
    result.forEach((item) => {
      console.log(
        `${item.cropName}: ₹${item.price}/${item.unit} (${item.season})`
      );
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding MSP data:", error);
    process.exit(1);
  }
};

seedMSP();

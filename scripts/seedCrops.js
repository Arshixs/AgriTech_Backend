// ============================================
// scripts/seedCrops.js
// Run this once to populate the CropMaster collection
// Usage: node scripts/seedCrops.js
// ============================================

require("dotenv").config();
const mongoose = require("mongoose");
const CropMaster = require("../models/CropMaster");

const cropData = [
  // Kharif Crops
  {
    cropName: "Paddy (Common)",
    season: "kharif",
    duration: "120-150 days",
    waterRequirement: "High",
    soilType: ["Clay", "Loamy"],
    icon: "rice",
    hasMSP: true,
  },
  {
    cropName: "Paddy (Grade A)",
    season: "kharif",
    duration: "120-150 days",
    waterRequirement: "High",
    soilType: ["Clay", "Loamy"],
    icon: "rice",
    hasMSP: true,
  },
  {
    cropName: "Jowar (Hybrid)",
    season: "kharif",
    duration: "100-110 days",
    waterRequirement: "Low",
    soilType: ["Sandy", "Loamy"],
    icon: "grain",
    hasMSP: true,
  },
  {
    cropName: "Jowar (Maldandi)",
    season: "kharif",
    duration: "100-110 days",
    waterRequirement: "Low",
    soilType: ["Sandy", "Loamy"],
    icon: "grain",
    hasMSP: true,
  },
  {
    cropName: "Bajra",
    season: "kharif",
    duration: "75-90 days",
    waterRequirement: "Low",
    soilType: ["Sandy", "Loamy"],
    icon: "barley",
    hasMSP: true,
  },
  {
    cropName: "Maize",
    season: "kharif",
    duration: "80-110 days",
    waterRequirement: "Medium",
    soilType: ["Loamy", "Sandy"],
    icon: "corn",
    hasMSP: true,
  },
  {
    cropName: "Ragi",
    season: "kharif",
    duration: "120-130 days",
    waterRequirement: "Low",
    soilType: ["Sandy", "Loamy"],
    icon: "barley",
    hasMSP: true,
  },
  {
    cropName: "Arhar (Tur)",
    season: "kharif",
    duration: "150-180 days",
    waterRequirement: "Low",
    soilType: ["Clay", "Loamy"],
    icon: "seed",
    hasMSP: true,
  },
  {
    cropName: "Moong",
    season: "kharif",
    duration: "60-75 days",
    waterRequirement: "Low",
    soilType: ["Loamy", "Sandy"],
    icon: "seed",
    hasMSP: true,
  },
  {
    cropName: "Urad",
    season: "kharif",
    duration: "75-90 days",
    waterRequirement: "Low",
    soilType: ["Loamy", "Clay"],
    icon: "seed",
    hasMSP: true,
  },
  {
    cropName: "Cotton (Medium Staple)",
    season: "kharif",
    duration: "150-180 days",
    waterRequirement: "Medium",
    soilType: ["Black", "Loamy"],
    icon: "flower",
    hasMSP: true,
  },
  {
    cropName: "Cotton (Long Staple)",
    season: "kharif",
    duration: "150-180 days",
    waterRequirement: "Medium",
    soilType: ["Black", "Loamy"],
    icon: "flower",
    hasMSP: true,
  },
  {
    cropName: "Groundnut",
    season: "kharif",
    duration: "100-120 days",
    waterRequirement: "Low",
    soilType: ["Sandy", "Loamy"],
    icon: "peanut",
    hasMSP: true,
  },
  {
    cropName: "Soyabean (Yellow)",
    season: "kharif",
    duration: "90-110 days",
    waterRequirement: "Medium",
    soilType: ["Loamy", "Clay"],
    icon: "seed",
    hasMSP: true,
  },
  {
    cropName: "Sunflower Seed",
    season: "kharif",
    duration: "90-100 days",
    waterRequirement: "Low",
    soilType: ["Loamy", "Sandy"],
    icon: "white-balance-sunny",
    hasMSP: true,
  },
  {
    cropName: "Sesamum",
    season: "kharif",
    duration: "90-120 days",
    waterRequirement: "Low",
    soilType: ["Sandy", "Loamy"],
    icon: "seed",
    hasMSP: true,
  },
  {
    cropName: "Niger Seed",
    season: "kharif",
    duration: "110-120 days",
    waterRequirement: "Low",
    soilType: ["Sandy", "Loamy"],
    icon: "seed",
    hasMSP: true,
  },

  // Rabi Crops
  {
    cropName: "Wheat",
    season: "rabi",
    duration: "120-150 days",
    waterRequirement: "Medium",
    soilType: ["Loamy", "Clay"],
    icon: "barley",
    hasMSP: true,
  },
  {
    cropName: "Barley",
    season: "rabi",
    duration: "120-140 days",
    waterRequirement: "Low",
    soilType: ["Loamy", "Sandy"],
    icon: "barley",
    hasMSP: true,
  },
  {
    cropName: "Gram",
    season: "rabi",
    duration: "100-120 days",
    waterRequirement: "Low",
    soilType: ["Loamy", "Clay"],
    icon: "seed",
    hasMSP: true,
  },
  {
    cropName: "Masur (Lentil)",
    season: "rabi",
    duration: "120-140 days",
    waterRequirement: "Low",
    soilType: ["Loamy", "Sandy"],
    icon: "seed",
    hasMSP: true,
  },
  {
    cropName: "Rapeseed/Mustard",
    season: "rabi",
    duration: "120-150 days",
    waterRequirement: "Low",
    soilType: ["Loamy", "Clay"],
    icon: "seed",
    hasMSP: true,
  },
  {
    cropName: "Safflower",
    season: "rabi",
    duration: "120-150 days",
    waterRequirement: "Low",
    soilType: ["Loamy", "Sandy"],
    icon: "flower",
    hasMSP: true,
  },
  {
    cropName: "Toria",
    season: "rabi",
    duration: "90-100 days",
    waterRequirement: "Low",
    soilType: ["Loamy", "Sandy"],
    icon: "seed",
    hasMSP: true,
  },

  // Year-round Crops
  {
    cropName: "Sugarcane",
    season: "year-round",
    duration: "10-12 months",
    waterRequirement: "High",
    soilType: ["Loamy", "Clay"],
    icon: "grain",
    hasMSP: true,
  },
  {
    cropName: "Copra (Coconut)",
    season: "year-round",
    duration: "Perennial",
    waterRequirement: "Medium",
    soilType: ["Sandy", "Loamy"],
    icon: "palm-tree",
    hasMSP: true,
  },
  {
    cropName: "De-husked Coconut",
    season: "year-round",
    duration: "Perennial",
    waterRequirement: "Medium",
    soilType: ["Sandy", "Loamy"],
    icon: "palm-tree",
    hasMSP: true,
  },
  {
    cropName: "Jute",
    season: "year-round",
    duration: "120-150 days",
    waterRequirement: "High",
    soilType: ["Clay", "Loamy"],
    icon: "leaf",
    hasMSP: true,
  },
];

async function seedCrops() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Clear existing crops (optional)
    await CropMaster.deleteMany({});
    console.log("Cleared existing crops");

    // Insert new crops
    await CropMaster.insertMany(cropData);
    console.log(`Successfully seeded ${cropData.length} crops`);

    process.exit(0);
  } catch (error) {
    console.error("Seeding Error:", error);
    process.exit(1);
  }
}

seedCrops();

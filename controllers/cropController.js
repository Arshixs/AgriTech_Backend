// ============================================
// controllers/cropController.js
// ============================================
const CropMaster = require("../models/CropMaster");

// Get all active crops
exports.getAllCrops = async (req, res) => {
  try {
    const crops = await CropMaster.find({ isActive: true }).sort({
      cropName: 1,
    });
    // console.log("HERE");
    // console.log(crops);
    res.status(200).json({ crops });
  } catch (error) {
    console.error("Get Crops Error:", error);
    res.status(500).json({ message: "Server Error fetching crops" });
  }
};

// Get crops by season
exports.getCropsBySeason = async (req, res) => {
  try {
    const { season } = req.params;
    const crops = await CropMaster.find({
      isActive: true,
      season: { $in: [season, "year-round"] },
    }).sort({ cropName: 1 });

    res.status(200).json({ crops });
  } catch (error) {
    console.error("Get Crops by Season Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Add new crop (Government only)
exports.addCrop = async (req, res) => {
  try {
    const { role } = req.user;

    if (role !== "govt") {
      return res
        .status(403)
        .json({ message: "Only government officials can add crops" });
    }

    const {
      cropName,
      season,
      duration,
      waterRequirement,
      soilType,
      icon,
      hasMSP,
    } = req.body;

    const crop = new CropMaster({
      cropName,
      season,
      duration,
      waterRequirement,
      soilType,
      icon,
      hasMSP,
      addedBy: "government",
    });

    await crop.save();
    res.status(201).json({ message: "Crop added successfully", crop });
  } catch (error) {
    console.error("Add Crop Error:", error);
    res.status(500).json({ message: "Server Error adding crop" });
  }
};

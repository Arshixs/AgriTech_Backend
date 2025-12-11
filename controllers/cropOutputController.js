// ============================================
// controllers/cropOutputController.js
// ============================================
const CropOutput = require("../models/CropOutput");
const Field = require("../models/Field");
const CropMaster = require("../models/CropMaster");

// Create crop output (after harvest)
exports.createCropOutput = async (req, res) => {
  try {
    const { userId } = req.user;
    const { fieldId, quantity, unit, harvestDate, storageLocation, notes } =
      req.body;

    // Validate field belongs to farmer
    const field = await Field.findOne({
      _id: fieldId,
      farmerId: userId,
    }).populate("cropId");

    if (!field) {
      return res.status(404).json({ message: "Field not found" });
    }

    if (!field.cropId) {
      return res.status(400).json({ message: "No crop planted in this field" });
    }

    // Create crop output
    const cropOutput = new CropOutput({
      farmerId: userId,
      fieldId,
      cropId: field.cropId._id,
      quantity,
      unit,
      harvestDate: harvestDate || Date.now(),
      storageLocation,
      notes,
      status: "available",
    });

    await cropOutput.save();

    // Update field status to Fallow
    field.status = "Fallow";
    field.plantedDate = undefined;
    field.expectedHarvest = undefined;
    await field.save();

    // Populate crop details
    await cropOutput.populate("cropId fieldId");

    res.status(201).json({
      message: "Crop output created successfully",
      cropOutput,
    });
  } catch (error) {
    console.error("Create Crop Output Error:", error);
    res.status(500).json({ message: "Server Error creating crop output" });
  }
};

// Get farmer's crop outputs
exports.getMyCropOutputs = async (req, res) => {
  try {
    const { userId } = req.user;
    const { status } = req.query;

    const filter = { farmerId: userId };
    if (status) filter.status = status;

    const outputs = await CropOutput.find(filter)
      .populate("cropId fieldId")
      .sort({ createdAt: -1 });

    res.status(200).json({ outputs });
  } catch (error) {
    console.error("Get Crop Outputs Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Get single crop output
exports.getCropOutputById = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;

    const output = await CropOutput.findOne({
      _id: id,
      farmerId: userId,
    }).populate("cropId fieldId qualityRequestId");

    if (!output) {
      return res.status(404).json({ message: "Crop output not found" });
    }

    res.status(200).json({ output });
  } catch (error) {
    console.error("Get Crop Output Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Update crop output status
exports.updateCropOutputStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;
    const { status } = req.body;

    const output = await CropOutput.findOneAndUpdate(
      { _id: id, farmerId: userId },
      { status },
      { new: true }
    ).populate("cropId fieldId");

    if (!output) {
      return res.status(404).json({ message: "Crop output not found" });
    }

    res.status(200).json({ message: "Status updated", output });
  } catch (error) {
    console.error("Update Status Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

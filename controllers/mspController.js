// File: controllers/mspController.js

const MSP = require("../models/MSP");

// PUBLIC: Get all active MSP prices
exports.getAllMSP = async (req, res) => {
  try {
    const { season } = req.query;

    const query = { isActive: true };
    if (season) {
      query.season = season;
    }

    const mspList = await MSP.find(query).select("-__v").sort({ cropName: 1 });

    res.status(200).json({
      count: mspList.length,
      data: mspList,
    });
  } catch (error) {
    console.error("Get All MSP Error:", error);
    res.status(500).json({ message: "Server Error fetching MSP data" });
  }
};

// PUBLIC: Get MSP by crop name
exports.getMSPByCrop = async (req, res) => {
  try {
    const { cropName } = req.params;

    const msp = await MSP.findOne({
      cropName: { $regex: new RegExp(cropName, "i") },
      isActive: true,
    });

    if (!msp) {
      return res.status(404).json({ message: "MSP for this crop not found" });
    }

    res.status(200).json({ data: msp });
  } catch (error) {
    console.error("Get MSP by Crop Error:", error);
    res.status(500).json({ message: "Server Error fetching MSP data" });
  }
};

// PROTECTED: Create new MSP entry
exports.createMSP = async (req, res) => {
  try {
    const { govtId } = req.user;
    const { cropName, price, unit, season, effectiveFrom } = req.body;

    if (!cropName || !price) {
      return res.status(400).json({
        message: "Crop name and price are required",
      });
    }

    // Check if MSP already exists for this crop
    const existingMSP = await MSP.findOne({ cropName });
    if (existingMSP) {
      return res.status(400).json({
        message: "MSP for this crop already exists. Use update instead.",
      });
    }

    const msp = new MSP({
      cropName,
      price,
      unit: unit || "quintal",
      season: season || "year-round",
      effectiveFrom: effectiveFrom || Date.now(),
      lastUpdatedBy: govtId,
    });

    await msp.save();

    res.status(201).json({
      message: "MSP created successfully",
      data: msp,
    });
  } catch (error) {
    console.error("Create MSP Error:", error);
    res.status(500).json({ message: "Server Error creating MSP" });
  }
};

// PROTECTED: Update MSP price
exports.updateMSP = async (req, res) => {
  try {
    const { govtId } = req.user;
    const { id } = req.params;
    const { price, unit, season, effectiveFrom, isActive } = req.body;

    if (
      !price &&
      !unit &&
      !season &&
      effectiveFrom === undefined &&
      isActive === undefined
    ) {
      return res.status(400).json({
        message: "At least one field to update is required",
      });
    }

    const updateData = {
      lastUpdatedBy: govtId,
    };

    if (price !== undefined) updateData.price = price;
    if (unit) updateData.unit = unit;
    if (season) updateData.season = season;
    if (effectiveFrom) updateData.effectiveFrom = effectiveFrom;
    if (isActive !== undefined) updateData.isActive = isActive;

    const msp = await MSP.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!msp) {
      return res.status(404).json({ message: "MSP entry not found" });
    }

    res.status(200).json({
      message: "MSP updated successfully",
      data: msp,
    });
  } catch (error) {
    console.error("Update MSP Error:", error);
    res.status(500).json({ message: "Server Error updating MSP" });
  }
};

// PROTECTED: Delete MSP entry (soft delete by setting isActive to false)
exports.deleteMSP = async (req, res) => {
  try {
    const { id } = req.params;
    const { govtId } = req.user;

    const msp = await MSP.findByIdAndUpdate(
      id,
      { isActive: false, lastUpdatedBy: govtId },
      { new: true }
    );

    if (!msp) {
      return res.status(404).json({ message: "MSP entry not found" });
    }

    res.status(200).json({
      message: "MSP deactivated successfully",
      data: msp,
    });
  } catch (error) {
    console.error("Delete MSP Error:", error);
    res.status(500).json({ message: "Server Error deleting MSP" });
  }
};

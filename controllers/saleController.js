// controllers/saleController.js
const Sale = require("../models/Sale");
const CropOutput = require("../models/CropOutput");
const MSP = require("../models/MSP");
const CropMaster = require("../models/CropMaster");
const GovtProcurementRequest = require("../models/GovtProcurementRequest");
const QualityRequest = require("../models/QualityRequest");

// List crop for marketplace sale
exports.listForMarketplace = async (req, res) => {
  try {
    const { userId } = req.user;
    const { cropOutputId, minimumPrice } = req.body;

    if (!minimumPrice || minimumPrice <= 0) {
      return res.status(400).json({
        message: "Please provide a valid minimum price",
      });
    }

    // Verify crop output exists and belongs to farmer
    const cropOutput = await CropOutput.findOne({
      _id: cropOutputId,
      farmerId: userId,
    }).populate("cropId fieldId qualityRequestId");

    if (!cropOutput) {
      return res.status(404).json({
        message: "Crop output not found",
      });
    }

    // Check if already listed
    const existingSale = await Sale.findOne({
      cropOutputId,
      status: { $in: ["active", "pending_govt_approval"] },
    });

    if (existingSale) {
      return res.status(400).json({
        message: "This crop is already listed for sale",
      });
    }

    // Check if crop is available for sale
    if (!["available", "quality-approved", "quality-rejected"].includes(cropOutput.status)) {
      return res.status(400).json({
        message: "Only available or quality-approved or rejected crops can be listed",
      });
    }

    // Get quality certification status
    let hasQualityCertificate = false;
    let qualityGrade = null;

    if (
      cropOutput.qualityRequestId &&
      cropOutput.status === "quality-approved"
    ) {
      const qualityRequest = await QualityRequest.findById(
        cropOutput.qualityRequestId
      );
      if (qualityRequest && qualityRequest.status === "approved") {
        hasQualityCertificate = true;
        qualityGrade = qualityRequest.grade;
      }
    }

    // Create sale listing
    const sale = new Sale({
      farmerId: userId,
      cropOutputId: cropOutput._id,
      cropId: cropOutput.cropId._id,
      fieldId: cropOutput.fieldId._id,
      saleType: "marketplace",
      quantity: cropOutput.quantity,
      unit: cropOutput.unit,
      minimumPrice,
      hasQualityCertificate,
      qualityGrade,
      qualityRequestId: cropOutput.qualityRequestId,
      harvestDate: cropOutput.harvestDate,
      storageLocation: cropOutput.storageLocation,
      status: "active",
    });

    await sale.save();

    // Update crop output status
    cropOutput.status = "listed-for-sale";
    cropOutput.saleId = sale._id;
    await cropOutput.save();

    await sale.populate("cropId fieldId");

    res.status(201).json({
      message: "Crop listed for sale successfully",
      sale,
    });
  } catch (error) {
    console.error("List for Marketplace Error:", error);
    res.status(500).json({
      message: "Server Error listing crop for sale",
    });
  }
};

// List crop for government MSP sale
exports.listForGovernmentMSP = async (req, res) => {
  try {
    const { userId } = req.user;
    const { cropOutputId } = req.body;

    // Verify crop output exists and belongs to farmer
    const cropOutput = await CropOutput.findOne({
      _id: cropOutputId,
      farmerId: userId,
    }).populate("cropId fieldId qualityRequestId");

    if (!cropOutput) {
      return res.status(404).json({
        message: "Crop output not found",
      });
    }

    // Check if already listed
    const existingSale = await Sale.findOne({
      cropOutputId,
      status: { $in: ["active", "pending_govt_approval"] },
    });

    if (existingSale) {
      return res.status(400).json({
        message: "This crop is already listed for sale",
      });
    }

    // Check if crop is available for sale
    if (!["available", "quality-approved", "quality-rejected"].includes(cropOutput.status)) {
      return res.status(400).json({
        message: "Only available or quality-approved crops or quality-rejected can be listed",
      });
    }

    // Get MSP for this crop
    const crop = await CropMaster.findById(cropOutput.cropId._id);
    if (!crop || !crop.hasMSP) {
      return res.status(400).json({
        message: "This crop does not have an MSP listed",
      });
    }

    const mspData = await MSP.findOne({
      cropName: crop.cropName,
      isActive: true,
    });

    if (!mspData) {
      return res.status(404).json({
        message: "MSP not found for this crop",
      });
    }

    // Get quality certification status
    let hasQualityCertificate = false;
    let qualityGrade = null;

    if (
      cropOutput.qualityRequestId &&
      cropOutput.status === "quality-approved"
    ) {
      const qualityRequest = await QualityRequest.findById(
        cropOutput.qualityRequestId
      );
      if (qualityRequest && qualityRequest.status === "approved") {
        hasQualityCertificate = true;
        qualityGrade = qualityRequest.grade;
      }
    }

    // Create sale listing for government
    const sale = new Sale({
      farmerId: userId,
      cropOutputId: cropOutput._id,
      cropId: cropOutput.cropId._id,
      fieldId: cropOutput.fieldId._id,
      saleType: "government_msp",
      quantity: cropOutput.quantity,
      unit: cropOutput.unit,
      mspPrice: mspData.price,
      hasQualityCertificate,
      qualityGrade,
      qualityRequestId: cropOutput.qualityRequestId,
      harvestDate: cropOutput.harvestDate,
      storageLocation: cropOutput.storageLocation,
      status: "pending_govt_approval",
    });

    await sale.save();

    // Create government procurement request
    const totalAmount = mspData.price * cropOutput.quantity;

    const procurementRequest = new GovtProcurementRequest({
      farmerId: userId,
      saleId: sale._id,
      cropOutputId: cropOutput._id,
      cropId: cropOutput.cropId._id,
      quantity: cropOutput.quantity,
      unit: cropOutput.unit,
      mspPrice: mspData.price,
      totalAmount,
      hasQualityCertificate,
      qualityGrade,
      status: "pending",
    });

    await procurementRequest.save();

    // Link procurement request to sale
    sale.govtRequestId = procurementRequest._id;
    await sale.save();

    // Update crop output status
    cropOutput.status = "listed-for-sale";
    cropOutput.saleId = sale._id;
    await cropOutput.save();

    await sale.populate("cropId fieldId");

    res.status(201).json({
      message: "Government MSP sale request submitted successfully",
      sale,
      procurementRequest,
      mspPrice: mspData.price,
      totalAmount,
    });
  } catch (error) {
    console.error("List for Government MSP Error:", error);
    res.status(500).json({
      message: "Server Error creating government sale request",
    });
  }
};

// Get farmer's sales
exports.getMySales = async (req, res) => {
  try {
    const { userId } = req.user;
    const { status, saleType } = req.query;

    const filter = { farmerId: userId };
    if (status) filter.status = status;
    if (saleType) filter.saleType = saleType;

    const sales = await Sale.find(filter)
      .populate("cropId fieldId qualityRequestId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      sales,
    });
  } catch (error) {
    console.error("Get Sales Error:", error);
    res.status(500).json({
      message: "Server Error fetching sales",
    });
  }
};

// Get single sale details
exports.getSaleById = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;

    const sale = await Sale.findOne({
      _id: id,
      farmerId: userId,
    }).populate("cropId fieldId qualityRequestId govtRequestId");

    if (!sale) {
      return res.status(404).json({
        message: "Sale not found",
      });
    }

    res.status(200).json({
      sale,
    });
  } catch (error) {
    console.error("Get Sale Error:", error);
    res.status(500).json({
      message: "Server Error",
    });
  }
};

// Cancel sale listing
exports.cancelSale = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;

    const sale = await Sale.findOne({
      _id: id,
      farmerId: userId,
    });

    if (!sale) {
      return res.status(404).json({
        message: "Sale not found",
      });
    }

    if (sale.status === "sold") {
      return res.status(400).json({
        message: "Cannot cancel a completed sale",
      });
    }

    // Update sale status
    sale.status = "cancelled";
    await sale.save();

    // Update crop output status back to available/quality-approved
    const cropOutput = await CropOutput.findById(sale.cropOutputId).populate(
      "qualityRequestId"
    );

    if (cropOutput) {
      if (
        cropOutput.qualityRequestId &&
        cropOutput.qualityRequestId.status === "approved"
      ) {
        cropOutput.status = "quality-approved";
      } else {
        cropOutput.status = "available";
      }
      cropOutput.saleId = undefined;
      await cropOutput.save();
    }

    // If government sale, update procurement request
    if (sale.saleType === "government_msp" && sale.govtRequestId) {
      await GovtProcurementRequest.findByIdAndUpdate(sale.govtRequestId, {
        status: "rejected",
        rejectionReason: "Cancelled by farmer",
      });
    }

    res.status(200).json({
      message: "Sale cancelled successfully",
      sale,
    });
  } catch (error) {
    console.error("Cancel Sale Error:", error);
    res.status(500).json({
      message: "Server Error",
    });
  }
};

// Update sale price (marketplace only)
exports.updateSalePrice = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;
    const { minimumPrice } = req.body;

    if (!minimumPrice || minimumPrice <= 0) {
      return res.status(400).json({
        message: "Please provide a valid minimum price",
      });
    }

    const sale = await Sale.findOne({
      _id: id,
      farmerId: userId,
      saleType: "marketplace",
    });

    if (!sale) {
      return res.status(404).json({
        message: "Sale not found",
      });
    }

    if (sale.status !== "active") {
      return res.status(400).json({
        message: "Can only update price for active listings",
      });
    }

    sale.minimumPrice = minimumPrice;
    await sale.save();

    res.status(200).json({
      message: "Price updated successfully",
      sale,
    });
  } catch (error) {
    console.error("Update Sale Price Error:", error);
    res.status(500).json({
      message: "Server Error",
    });
  }
};

// Get MSP for a crop (helper endpoint)
exports.getMSPForCrop = async (req, res) => {
  try {
    const { cropId } = req.params;

    const crop = await CropMaster.findById(cropId);
    if (!crop) {
      return res.status(404).json({
        message: "Crop not found",
      });
    }

    if (!crop.hasMSP) {
      return res.status(404).json({
        message: "This crop does not have MSP",
        hasMSP: false,
      });
    }

    const msp = await MSP.findOne({
      cropName: crop.cropName,
      isActive: true,
    });

    if (!msp) {
      return res.status(404).json({
        message: "MSP not found for this crop",
        hasMSP: false,
      });
    }

    res.status(200).json({
      hasMSP: true,
      msp: {
        price: msp.price,
        unit: msp.unit,
        season: msp.season,
        effectiveFrom: msp.effectiveFrom,
      },
    });
  } catch (error) {
    console.error("Get MSP Error:", error);
    res.status(500).json({
      message: "Server Error",
    });
  }
};

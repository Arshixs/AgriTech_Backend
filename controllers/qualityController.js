// controllers/qualityController.js - UPDATED FOR SEPARATE STATUS
const QualityRequest = require("../models/QualityRequest");
const Field = require("../models/Field");
const CropOutput = require("../models/CropOutput");
const Sale= require("../models/Sale")

// ============ FARMER CONTROLLERS ============

// GET FARMER'S QUALITY REQUESTS
exports.getFarmerRequests = async (req, res) => {
  try {
    const { userId } = req.user;

    const requests = await QualityRequest.find({ farmerId: userId })
      .populate("fieldId", "name area")
      .populate("assignedOfficer", "name employeeId")
      .populate("cropId", "cropName")
      .sort({ createdAt: -1 });

    res.status(200).json({ requests });
  } catch (error) {
    console.error("Get Farmer Requests Error:", error);
    res.status(500).json({ message: "Server error fetching requests" });
  }
};

// GET SINGLE REQUEST DETAILS (with certificate)
exports.getRequestDetails = async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;

    const request = await QualityRequest.findOne({
      _id: id,
      farmerId: userId,
    })
      .populate("fieldId", "name area crop")
      .populate("assignedOfficer", "name employeeId phone")
      .populate("cropId", "cropName");

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    res.status(200).json({ request });
  } catch (error) {
    console.error("Get Request Details Error:", error);
    res.status(500).json({ message: "Server error fetching request details" });
  }
};

// ============ GOVERNMENT OFFICER CONTROLLERS ============

// GET ALL PENDING REQUESTS (for officers)
exports.getPendingRequests = async (req, res) => {
  try {
    const requests = await QualityRequest.find({
      status: { $in: ["pending", "in-progress"] },
    })
      .populate("farmerId", "name phone address")
      .populate("fieldId", "area name")
      .populate("cropId", "cropName")
      .sort({ createdAt: 1 });

    res.status(200).json({ requests });
  } catch (error) {
    console.error("Get Pending Requests Error:", error);
    res.status(500).json({ message: "Server error fetching pending requests" });
  }
};

// SEARCH REQUEST BY LOT ID
exports.searchRequestByLotId = async (req, res) => {
  try {
    const { lotId } = req.params;

    const request = await QualityRequest.findById(lotId)
      .populate("farmerId", "name phone address adharNumber")
      .populate("fieldId", "name area crop soilType")
      .populate("cropId", "cropName");

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    res.status(200).json({ request });
  } catch (error) {
    console.error("Search Request Error:", error);
    res.status(500).json({ message: "Server error searching request" });
  }
};

// ASSIGN INSPECTION TO OFFICER
exports.assignInspection = async (req, res) => {
  try {
    const { govtId } = req.user;
    const { requestId } = req.body;

    const request = await QualityRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Request is not in pending status" });
    }

    request.assignedOfficer = govtId;
    request.status = "in-progress";
    await request.save();

    res.status(200).json({
      message: "Inspection assigned successfully",
      request,
    });
  } catch (error) {
    console.error("Assign Inspection Error:", error);
    res.status(500).json({ message: "Server error assigning inspection" });
  }
};

// GET OFFICER'S ASSIGNED REQUESTS
exports.getOfficerRequests = async (req, res) => {
  try {
    const { govtId } = req.user;
    // console.log(requests);

    const requests = await QualityRequest.find({ assignedOfficer: govtId })
      .populate("farmerId", "name phone address")
      .populate("fieldId", "name area")
      .sort({ createdAt: -1 });

    //console.log(requests);

    res.status(200).json({ requests });
  } catch (error) {
    console.error("Get Officer Requests Error:", error);
    res.status(500).json({ message: "Server error fetching officer requests" });
  }
};

// GET GRADING STATISTICS (for dashboard)
exports.getGradingStats = async (req, res) => {
  try {
    const { govtId } = req.user;

    const stats = await QualityRequest.aggregate([
      { $match: { assignedOfficer: mongoose.Types.ObjectId(govtId) } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const gradeDistribution = await QualityRequest.aggregate([
      {
        $match: {
          assignedOfficer: mongoose.Types.ObjectId(govtId),
          grade: { $ne: null },
        },
      },
      {
        $group: {
          _id: "$grade",
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      statusStats: stats,
      gradeDistribution,
    });
  } catch (error) {
    console.error("Get Grading Stats Error:", error);
    res.status(500).json({ message: "Server error fetching stats" });
  }
};

// ============ CREATE & SUBMIT GRADING ============

// Farmer creates quality request (UPDATED)
exports.createQualityRequest = async (req, res) => {
  try {
    const { userId } = req.user;
    const { cropOutputId, storageLocation } = req.body;

    // Get crop output
    const cropOutput = await CropOutput.findOne({
      _id: cropOutputId,
      farmerId: userId,
    }).populate("cropId fieldId");

    if (!cropOutput) {
      return res.status(404).json({ message: "Crop output not found" });
    }

    // Check if quality request already exists
    if (cropOutput.qualityStatus === "pending") {
      return res
        .status(400)
        .json({ message: "Quality request already exists for this output" });
    }

    // Create quality request
    const qualityRequest = new QualityRequest({
      farmerId: userId,
      fieldId: cropOutput.fieldId._id,
      cropOutputId: cropOutput._id,
      cropId: cropOutput.cropId._id,
      quantity: cropOutput.quantity,
      unit: cropOutput.unit,
      harvestDate: cropOutput.harvestDate,
      storageLocation: storageLocation || cropOutput.storageLocation,
    });

    await qualityRequest.save();

    // Update crop output QUALITY STATUS only
    cropOutput.qualityStatus = "pending";
    cropOutput.qualityRequestId = qualityRequest._id;
    await cropOutput.save();

    res.status(201).json({
      message: "Quality request created successfully",
      request: qualityRequest,
    });
  } catch (error) {
    console.error("Create Quality Request Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Government submits grading (UPDATED)
exports.submitGrading = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { govtId } = req.user;
    const {
      grade,
      qualityParams,
      gradingNotes,
      rejectionReason,
      labName,
      labLocation,
      labCertificationNumber,
    } = req.body;

    const request = await QualityRequest.findOne({
      _id: requestId,
      assignedOfficer: govtId,
    });

    if (!request) {
      return res
        .status(404)
        .json({ message: "Request not found or not assigned to you" });
    }

    // Update quality request
    request.status = grade === "Rejected" ? "rejected" : "approved";
    request.grade = grade;
    request.qualityParams = qualityParams;
    request.gradingNotes = gradingNotes;
    request.rejectionReason = rejectionReason;
    request.inspectionDate = Date.now();

    // Lab information
    request.labName = labName;
    request.labLocation = labLocation;
    request.labCertificationNumber = labCertificationNumber;

    // Generate certificate if approved
    if (grade !== "Rejected") {
      request.certificateNumber = `CERT-${Date.now()}-${Math.floor(
        Math.random() * 1000
      )}`;
      request.certificateIssueDate = Date.now();
      request.certificateQRCode = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${request.certificateNumber}`;
    }

    const sale = await Sale.findOne({
      cropOutputId: request.cropOutputId,
      status: { $in: ["active", "pending_govt_approval"] },
    });

    if (sale) {
      // Update quality information in the sale
      if (grade !== "Rejected") {
        sale.hasQualityCertificate = true;
        sale.qualityGrade = grade;
        sale.qualityRequestId = request._id;
      } else {
        sale.hasQualityCertificate = false;
        sale.qualityGrade = null;
      }
      await sale.save();
    }

    await request.save();

    // Update crop output QUALITY STATUS only
    const cropOutput = await CropOutput.findById(request.cropOutputId);
    if (cropOutput) {
      cropOutput.qualityStatus = grade === "Rejected" ? "rejected" : "approved";
      await cropOutput.save();
    }

    res.status(200).json({
      message: "Grading submitted successfully",
      request,
    });
  } catch (error) {
    console.error("Submit Grading Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

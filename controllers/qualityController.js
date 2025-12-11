// File: controllers/qualityController.js

const QualityRequest = require("../models/QualityRequest");
const Field = require("../models/Field");
const QRCode = require("qrcode");

// ============ FARMER CONTROLLERS ============

// 1. CREATE QUALITY INSPECTION REQUEST
exports.createQualityRequest = async (req, res) => {
  try {
    const { userId } = req.user; // Farmer ID from JWT
    const { fieldId, cropName, quantity, unit, harvestDate, storageLocation } =
      req.body;

    // Validate field belongs to farmer
    const field = await Field.findOne({ _id: fieldId, farmerId: userId });
    if (!field) {
      return res
        .status(404)
        .json({ message: "Field not found or does not belong to you" });
    }

    // Check if there's already a pending request for this field
    const existingRequest = await QualityRequest.findOne({
      fieldId,
      status: { $in: ["pending", "in-progress"] },
    });

    if (existingRequest) {
      return res.status(400).json({
        message: "A quality inspection request already exists for this field",
      });
    }

    const qualityRequest = new QualityRequest({
      farmerId: userId,
      fieldId,
      cropName,
      quantity,
      unit,
      harvestDate,
      storageLocation,
      status: "pending",
    });

    await qualityRequest.save();

    res.status(201).json({
      message: "Quality inspection request created successfully",
      request: qualityRequest,
    });
  } catch (error) {
    console.error("Create Quality Request Error:", error);
    res.status(500).json({ message: "Server error creating quality request" });
  }
};

// 2. GET FARMER'S QUALITY REQUESTS
exports.getFarmerRequests = async (req, res) => {
  try {
    const { userId } = req.user;

    const requests = await QualityRequest.find({ farmerId: userId })
      .populate("fieldId", "name area")
      .populate("assignedOfficer", "name employeeId")
      .sort({ createdAt: -1 });

    res.status(200).json({ requests });
  } catch (error) {
    console.error("Get Farmer Requests Error:", error);
    res.status(500).json({ message: "Server error fetching requests" });
  }
};

// 3. GET SINGLE REQUEST DETAILS (with certificate)
exports.getRequestDetails = async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;

    const request = await QualityRequest.findOne({
      _id: id,
      farmerId: userId,
    })
      .populate("fieldId", "name area crop")
      .populate("assignedOfficer", "name employeeId phone");

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

// 4. GET ALL PENDING REQUESTS (for officers)
exports.getPendingRequests = async (req, res) => {
  try {
    const requests = await QualityRequest.find({
      status: { $in: ["pending", "in-progress"] },
    })
      .populate("farmerId", "name phone address")
      .populate("fieldId", "name area location")
      .sort({ createdAt: 1 }); // Oldest first

    res.status(200).json({ requests });
  } catch (error) {
    console.error("Get Pending Requests Error:", error);
    res.status(500).json({ message: "Server error fetching pending requests" });
  }
};

// 5. SEARCH REQUEST BY LOT ID
exports.searchRequestByLotId = async (req, res) => {
  try {
    const { lotId } = req.params;

    const request = await QualityRequest.findById(lotId)
      .populate("farmerId", "name phone address adharNumber")
      .populate("fieldId", "name area crop soilType");

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    res.status(200).json({ request });
  } catch (error) {
    console.error("Search Request Error:", error);
    res.status(500).json({ message: "Server error searching request" });
  }
};

// 6. ASSIGN INSPECTION TO OFFICER
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

// 7. SUBMIT QUALITY GRADING
exports.submitGrading = async (req, res) => {
  try {
    const { govtId } = req.user;
    const { requestId } = req.params;
    const {
      grade,
      qualityParams,
      gradingNotes,
      rejectionReason,
      inspectionDate,
    } = req.body;

    const request = await QualityRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Verify officer is assigned
    if (request.assignedOfficer.toString() !== govtId) {
      return res
        .status(403)
        .json({ message: "You are not assigned to this request" });
    }

    // Update grading information
    request.grade = grade;
    request.qualityParams = qualityParams;
    request.gradingNotes = gradingNotes;
    request.inspectionDate = inspectionDate || new Date();

    if (grade === "Rejected") {
      request.rejectionReason = rejectionReason;
      request.status = "rejected";
    } else {
      request.status = "approved";

      // Generate QR Code for certificate
      const certificateData = {
        certificateNumber: request.certificateNumber,
        crop: request.cropName,
        grade: grade,
        quantity: `${request.quantity} ${request.unit}`,
        farmerName: request.farmerId,
        issueDate: request.certificateIssueDate,
      };

      try {
        const qrCode = await QRCode.toDataURL(JSON.stringify(certificateData));
        request.certificateQRCode = qrCode;
      } catch (qrError) {
        console.error("QR Code generation error:", qrError);
      }
    }

    await request.save();

    const populatedRequest = await QualityRequest.findById(requestId)
      .populate("farmerId", "name phone")
      .populate("fieldId", "name area")
      .populate("assignedOfficer", "name employeeId");

    res.status(200).json({
      message: "Grading submitted successfully",
      request: populatedRequest,
    });
  } catch (error) {
    console.error("Submit Grading Error:", error);
    res.status(500).json({ message: "Server error submitting grading" });
  }
};

// 8. GET OFFICER'S ASSIGNED REQUESTS
exports.getOfficerRequests = async (req, res) => {
  try {
    const { govtId } = req.user;

    const requests = await QualityRequest.find({ assignedOfficer: govtId })
      .populate("farmerId", "name phone address")
      .populate("fieldId", "name area")
      .sort({ createdAt: -1 });

    res.status(200).json({ requests });
  } catch (error) {
    console.error("Get Officer Requests Error:", error);
    res.status(500).json({ message: "Server error fetching officer requests" });
  }
};

// 9. GET GRADING STATISTICS (for dashboard)
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

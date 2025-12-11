// File: routers/qualityRoutes.js

const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  // Farmer Controllers
  createQualityRequest,
  getFarmerRequests,
  getRequestDetails,

  // Government Officer Controllers
  getPendingRequests,
  searchRequestByLotId,
  assignInspection,
  submitGrading,
  getOfficerRequests,
  getGradingStats,
} = require("../controllers/qualityController");

// All routes require authentication
router.use(protect);

// ============ FARMER ROUTES ============
router.post("/farmer/create", createQualityRequest);
router.get("/farmer/requests", getFarmerRequests);
router.get("/farmer/request/:id", getRequestDetails);

// ============ GOVERNMENT OFFICER ROUTES ============
router.get("/govt/pending", getPendingRequests);
router.get("/govt/search/:lotId", searchRequestByLotId);
router.post("/govt/assign", assignInspection);
router.post("/govt/grade/:requestId", submitGrading);
router.get("/govt/my-requests", getOfficerRequests);
router.get("/govt/stats", getGradingStats);

module.exports = router;

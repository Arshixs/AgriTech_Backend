// ============================================
// routes/cropOutputRoutes.js
// ============================================
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  createCropOutput,
  getMyCropOutputs,
  getCropOutputById,
  updateCropOutputStatus,
} = require("../controllers/cropOutputController");

router.post("/create", protect, createCropOutput);
router.get("/my-outputs", protect, getMyCropOutputs);
router.get("/output/:id", protect, getCropOutputById);
router.put("/output/:id/status", protect, updateCropOutputStatus);

module.exports = router;

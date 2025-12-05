// File: routers/mspRoutes.js

const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getAllMSP,
  getMSPByCrop,
  createMSP,
  updateMSP,
  deleteMSP,
} = require("../controllers/mspController");

// PUBLIC ROUTES - Anyone can access
router.get("/", getAllMSP); // GET /api/msp
router.get("/:cropName", getMSPByCrop); // GET /api/msp/wheat

// PROTECTED ROUTES - Only government employees
router.post("/", protect, createMSP); // POST /api/msp
router.put("/:id", protect, updateMSP); // PUT /api/msp/:id
router.delete("/:id", protect, deleteMSP); // DELETE /api/msp/:id

module.exports = router;

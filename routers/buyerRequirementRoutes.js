const express = require("express");
const router = express.Router();
const {
  createRequirement,
  getMyRequirements,
  getRequirementsFeed,
  getRequirementById,
  updateRequirement,
  deleteRequirement,
} = require("../controllers/buyerRequirementController");
const { protect } = require("../middleware/authMiddleware");

// Protect all routes (Login required)
router.use(protect);

// 1. Create & Manage Own Requirements (Buyer Side)
router.post("/", createRequirement); // POST /api/requirements
router.get("/", getMyRequirements); // GET /api/requirements (Returns logged-in buyer's posts)

// 2. Marketplace Feed (Farmer Side - Public Feed)
router.get("/feed", getRequirementsFeed); // GET /api/requirements/feed

// 3. Single Requirement Operations
router.get("/:id", getRequirementById); // GET /api/requirements/:id
router.put("/:id", updateRequirement); // PUT /api/requirements/:id
router.delete("/:id", deleteRequirement); // DELETE /api/requirements/:id

module.exports = router;

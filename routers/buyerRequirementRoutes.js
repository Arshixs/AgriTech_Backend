const express = require("express");
const router = express.Router();
const {
  createRequirement,
  getMyRequirements,
  updateRequirement,
  deleteRequirement,
} = require("../controllers/buyerRequirementController");
const { protect } = require("../middleware/authMiddleware");

// Protect all routes (Login required)
router.use(protect);

router.post("/", createRequirement); // POST /api/buyer/requirements
router.get("/", getMyRequirements); // GET /api/buyer/requirements
router.put("/:id", updateRequirement); // PUT /api/buyer/requirements/:id
router.delete("/:id", deleteRequirement); // DELETE /api/buyer/requirements/:id

module.exports = router;

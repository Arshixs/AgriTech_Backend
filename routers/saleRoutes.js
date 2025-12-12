// routers/saleRoutes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  listForMarketplace,
  listForGovernmentMSP,
  getMySales,
  getSaleById,
  cancelSale,
  updateSalePrice,
  getMSPForCrop,
  getAllMarketplaceSales,
} = require("../controllers/saleController");

// All routes require authentication
router.use(protect);

// Listing routes
router.post("/marketplace", listForMarketplace);
router.get("/marketplace", getAllMarketplaceSales);
router.post("/government-msp", listForGovernmentMSP);

// Get sales
router.get("/my-sales", getMySales);
router.get("/:id", getSaleById);

// Update/Cancel
router.put("/:id/price", updateSalePrice);
router.delete("/:id", cancelSale);

// Helper
router.get("/msp/:cropId", getMSPForCrop);

module.exports = router;

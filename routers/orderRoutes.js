const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  createOrder,
  getVendorOrders,
  getFarmerOrders,
  updateOrderStatus,
} = require("../controllers/orderController");

// Global Protection
router.use(protect);

// Farmer Routes
router.post("/create", createOrder); // POST /api/orders/create
router.get("/farmer/list", getFarmerOrders); // GET /api/orders/farmer/list

// Vendor Routes
router.get("/vendor/list", getVendorOrders); // GET /api/orders/vendor/list
router.post("/vendor/update-status", updateOrderStatus); // POST /api/orders/vendor/update-status

module.exports = router;

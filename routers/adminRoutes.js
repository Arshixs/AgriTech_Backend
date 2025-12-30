// ============================================
// File: routers/adminRoutes.js
// ============================================

const express = require("express");
const router = express.Router();
const {
  adminLogin,
  getAdminProfile,
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  verifyEmployee,
  getDashboardStats,
  deleteEmployee,
} = require("../controllers/adminController");
const { protectAdmin } = require("../middleware/adminMiddleware");

// Public Routes
router.post("/login", adminLogin);

// Protected Admin Routes
router.get("/profile", protectAdmin, getAdminProfile);
router.get("/dashboard/stats", protectAdmin, getDashboardStats);
router.post("/employees", protectAdmin, createEmployee);
router.get("/employees", protectAdmin, getAllEmployees);
router.get("/employees/:id", protectAdmin, getEmployeeById);
router.put("/employees/:id/verify", protectAdmin, verifyEmployee);
router.delete("/employees/:id", protectAdmin, deleteEmployee);

module.exports = router;

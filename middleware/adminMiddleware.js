// ============================================
// File: middleware/adminMiddleware.js
// ============================================

const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

const protectAdmin = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if the token contains adminId and role is admin
      if (!decoded.adminId || decoded.role !== "admin") {
        return res.status(403).json({
          message: "Access denied. Admin privileges required.",
        });
      }

      // Verify admin exists and is active
      const admin = await Admin.findById(decoded.adminId).select("-password");

      if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
      }

      if (!admin.isActive) {
        return res.status(403).json({ message: "Admin account is disabled" });
      }

      req.user = { adminId: admin._id, role: "admin" };
      req.admin = admin;
      next();
    } catch (error) {
      console.error("Admin auth error:", error);
      return res.status(401).json({
        message: "Not authorized, token failed",
      });
    }
  } else {
    return res.status(401).json({
      message: "Not authorized, no token",
    });
  }
};

module.exports = { protectAdmin };

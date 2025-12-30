// ============================================
// File: scripts/createAdmin.js
// ============================================

require("dotenv").config();
const mongoose = require("mongoose");
const Admin = require("../models/Admin");

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username: "admin" });
    if (existingAdmin) {
      console.log("Admin already exists!");
      process.exit(0);
    }

    // Create default admin
    const admin = new Admin({
      username: "admin",
      password: "admin123", // Change this in production!
      name: "System Administrator",
      email: "admin@agriportal.gov.in",
    });

    await admin.save();
    console.log("Admin created successfully!");
    console.log("Username: admin");
    console.log("Password: admin123");
    console.log("Please change the password after first login!");

    process.exit(0);
  } catch (error) {
    console.error("Error creating admin:", error);
    process.exit(1);
  }
};

createAdmin();

// ============================================
// Update app.js to include admin routes
// ============================================

// Add this line with other route imports:
// const adminRoutes = require("./routers/adminRoutes");

// Add this line with other route uses:
// app.use("/api/admin", adminRoutes);

// ============================================
// File: package.json additions
// ============================================

// Add these dependencies:
// "bcryptjs": "^2.4.3"

// Add this script:
// "create-admin": "node scripts/createAdmin.js"

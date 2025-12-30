// ============================================
// File: controllers/adminController.js
// ============================================

const Admin = require("../models/Admin");
const GovtEmployee = require("../models/GovtEmployee");
const jwt = require("jsonwebtoken");

// Admin Login
exports.adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password are required",
      });
    }

    const admin = await Admin.findOne({ username });

    if (!admin) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({
        message: "Account is disabled",
      });
    }

    const isMatch = await admin.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    const token = jwt.sign(
      { adminId: admin._id, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Admin Login Error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};

// Get Admin Profile
exports.getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id).select("-password");
    res.status(200).json({ admin });
  } catch (error) {
    console.error("Get Admin Profile Error:", error);
    res.status(500).json({ message: "Server error fetching profile" });
  }
};

// Create Employee
exports.createEmployee = async (req, res) => {
  try {
    const { phone, department, designation } = req.body;

    if (!phone) {
      return res.status(400).json({
        message: "Phone number is required",
      });
    }

    // Normalize phone number
    const normalizedPhone = phone.startsWith("+91") ? phone : `+91${phone}`;

    const existingEmployee = await GovtEmployee.findOne({
      phone: normalizedPhone,
    });

    if (existingEmployee) {
      return res.status(400).json({
        message: "Employee with this phone number already exists",
      });
    }

    const employee = new GovtEmployee({
      phone: normalizedPhone,
      department: department || "Department of Agriculture",
      designation: designation,
      createdByAdmin: true,
      profileComplete: false,
      verificationStatus: "pending",
    });

    await employee.save();

    res.status(201).json({
      message: "Employee created successfully",
      employee: {
        id: employee._id,
        phone: employee.phone,
        department: employee.department,
        createdAt: employee.createdAt,
        designation: employee.designation
      },
    });
  } catch (error) {
    console.error("Create Employee Error:", error);
    res.status(500).json({ message: "Server error creating employee" });
  }
};

// Get All Employees
exports.getAllEmployees = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;

    const query = {};

    if (status) {
      query.verificationStatus = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const employees = await GovtEmployee.find(query)
      .select("-otp -otpExpires")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await GovtEmployee.countDocuments(query);

    res.status(200).json({
      employees,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get All Employees Error:", error);
    res.status(500).json({ message: "Server error fetching employees" });
  }
};

// Get Employee by ID
exports.getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await GovtEmployee.findById(id)
      .select("-otp -otpExpires")
      .populate("verifiedBy", "name username");

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.status(200).json({ employee });
  } catch (error) {
    console.error("Get Employee Error:", error);
    res.status(500).json({ message: "Server error fetching employee" });
  }
};

// Verify Employee
exports.verifyEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, notes, rejectionReason } = req.body;

    if (!["verify", "reject"].includes(action)) {
      return res.status(400).json({
        message: "Action must be either 'verify' or 'reject'",
      });
    }

    const employee = await GovtEmployee.findById(id);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    if (!employee.profileComplete) {
      return res.status(400).json({
        message: "Employee has not completed their profile",
      });
    }

    if (action === "verify") {
      employee.verificationStatus = "verified";
      employee.verifiedAt = new Date();
      employee.verifiedBy = req.admin._id;
      employee.verificationNotes = notes;
    } else {
      employee.verificationStatus = "rejected";
      employee.rejectionReason = rejectionReason;
    }

    await employee.save();

    res.status(200).json({
      message: `Employee ${
        action === "verify" ? "verified" : "rejected"
      } successfully`,
      employee: {
        id: employee._id,
        name: employee.name,
        phone: employee.phone,
        verificationStatus: employee.verificationStatus,
      },
    });
  } catch (error) {
    console.error("Verify Employee Error:", error);
    res.status(500).json({ message: "Server error verifying employee" });
  }
};

// Get Dashboard Stats
exports.getDashboardStats = async (req, res) => {
  try {
    const totalEmployees = await GovtEmployee.countDocuments();
    const pendingVerifications = await GovtEmployee.countDocuments({
      profileComplete: true,
      verificationStatus: "pending",
    });
    const verifiedEmployees = await GovtEmployee.countDocuments({
      verificationStatus: "verified",
    });
    const rejectedEmployees = await GovtEmployee.countDocuments({
      verificationStatus: "rejected",
    });
    const incompleteProfiles = await GovtEmployee.countDocuments({
      profileComplete: false,
    });

    res.status(200).json({
      stats: {
        totalEmployees,
        pendingVerifications,
        verifiedEmployees,
        rejectedEmployees,
        incompleteProfiles,
      },
    });
  } catch (error) {
    console.error("Get Dashboard Stats Error:", error);
    res.status(500).json({ message: "Server error fetching stats" });
  }
};

// Delete Employee
exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await GovtEmployee.findById(id);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    await GovtEmployee.findByIdAndDelete(id);

    res.status(200).json({
      message: "Employee deleted successfully",
    });
  } catch (error) {
    console.error("Delete Employee Error:", error);
    res.status(500).json({ message: "Server error deleting employee" });
  }
};

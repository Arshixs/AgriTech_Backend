// File: app.js

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./routers/authRoutes");
const vendorAuthRoutes = require("./routers/vendorAuthRoutes");
const buyerAuthRoutes = require("./routers/buyerAuthRoutes");

const app = express();

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: "*", // allow all mobile requests
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/vendor/auth", vendorAuthRoutes);
app.use("/api/buyer/auth", buyerAuthRoutes);

// Database Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error(err));

module.exports = app;

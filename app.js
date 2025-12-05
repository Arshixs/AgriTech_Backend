// File: app.js

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./routers/authRoutes");
const vendorAuthRoutes = require("./routers/vendorAuthRoutes");
const vendorProductRoutes = require("./routers/vendorProductRoutes");
const buyerAuthRoutes = require("./routers/buyerAuthRoutes");
const orderRoutes = require("./routers/orderRoutes");
const expenseRoutes = require("./routers/expenseRoutes");
const govtAuthRoutes = require("./routers/govtAuthRoutes");
const mspRoutes = require("./routers/mspRoutes");
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
app.use("/api/vendor/product", vendorProductRoutes);
app.use("/api/buyer/auth", buyerAuthRoutes);
app.use("/api/govt/auth", govtAuthRoutes);
app.use("/api/msp", mspRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Server is running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});
app.use("/api/orders", orderRoutes);
app.use("/api/expenses", expenseRoutes);

// Database Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error(err));

module.exports = app;

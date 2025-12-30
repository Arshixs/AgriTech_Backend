const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware"); // For JWT protection
const {
  getFarmerAlerts,
  getCurrentWeather,
  getLatestSoilData,
  getCropRecommendations,
  getPriceForecast,
  getIotDevices,
  getTransactions,
} = require("../controllers/farmerDataController");
const {
  predictCropProfitability,
} = require("../controllers/expensePredictionController");

// All routes here are protected and require a valid farmer JWT

// Alerts & Weather (alerts.js support)
router.get("/alerts", protect, getFarmerAlerts);
router.get("/weather", protect, getCurrentWeather);

// Recommendations & Soil (recommendations.js support)
router.get("/soil/latest", protect, getLatestSoilData);
router.get("/recommendations", protect, getCropRecommendations);

// Market Prices (priceforecast.js support)
// Query params: /api/data/market/forecast?crop=Rice&timeframe=3months
router.get("/market/forecast", protect, getPriceForecast);

//Expense Prediction
router.get("/expenses/predict", protect, predictCropProfitability);

router.get("/iot/devices", protect, getIotDevices);
router.get("/transactions", protect, getTransactions);

module.exports = router;

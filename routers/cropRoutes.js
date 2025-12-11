
// routes/cropRoutes.js
// ============================================
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getAllCrops,
  getCropsBySeason,
  addCrop, // For government only
} = require('../controllers/cropController');

// Public/Farmer routes
router.get('/crops', protect, getAllCrops);
router.get('/crops/season/:season', protect, getCropsBySeason);

// Government only route
router.post('/crops/add', protect, addCrop);

module.exports = router;

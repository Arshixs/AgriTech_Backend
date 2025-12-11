const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware'); // For JWT protection
const { 
    getFarmStats,
    getFarmerFields,
    createField,
    updateField,
    getTodaysTasks,
    completeTask,
    recordExpense,
    updateFieldCrop
} = require('../controllers/farmController'); 

// All routes here are protected and require a valid farmer JWT

// Field Management
router.put("/fields/:fieldId/crop", protect, updateFieldCrop);
router.get('/fields', protect, getFarmerFields); 
router.post('/fields', protect, createField); 
router.put('/fields/:id', protect, updateField); 

// Aggregate Stats (for Home & Farm screens)
router.get('/stats', protect, getFarmStats); 

// Task Management (for Home screen)
router.get('/tasks/today', protect, getTodaysTasks);
router.put('/tasks/:id/complete', protect, completeTask);

// Expense Tracking
router.post('/expenses', protect, recordExpense);

module.exports = router;
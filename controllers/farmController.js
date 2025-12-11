const mongoose = require('mongoose'); // Import mongoose to use ObjectId
const Field = require('../models/Field');
const Task = require('../models/Task');
const Expense = require('../models/Expense');
const Alert = require('../models/Alert');

// Utility function to extract farmer ID from the JWT payload
const getFarmerId = (req) => req.user.userId;

// --- 1. Field Management ---

// POST /api/farm/fields
exports.createField = async (req, res) => {
    try {
        const farmerId = getFarmerId(req);
        const { name, area, crop, soilType, irrigationType, coordinates } = req.body;

        if (!name || !area || !crop) {
            return res.status(400).json({ message: 'Name, area, and crop are required for a new field.' });
        }
        
        const newField = await Field.create({
            farmerId,
            name,
            area,
            crop,
            soilType: soilType || 'Unknown',
            irrigationType: irrigationType || 'Drip',
            status: 'Preparing', // New fields start in 'Preparing' status
            healthScore: null,
            coordinates: coordinates || { lat: 0, lng: 0 }
        });

        res.status(201).json({ message: 'Field created successfully', field: newField });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error creating field' });
    }
};

// GET /api/farm/fields
exports.getFarmerFields = async (req, res) => {
    try {
        const farmerId = getFarmerId(req);
        // Sort by name for consistent list order
        const fields = await Field.find({ farmerId }).sort({ name: 1 });
        
        res.status(200).json({ fields });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error retrieving fields' });
    }
};


// controllers/fieldController.js - ADD THIS METHOD

const CropMaster = require('../models/CropMaster');

// ... (keep existing methods)

// Update field crop (plant a crop)
exports.updateFieldCrop = async (req, res) => {
  try {
    const { fieldId } = req.params;
    const { userId } = req.user;
    const { cropId, plantedDate, expectedHarvest } = req.body;
    
    // Validate crop exists
    const crop = await CropMaster.findById(cropId);
    if (!crop) {
      return res.status(404).json({ message: 'Crop not found' });
    }
    
    // Find and update field
    const field = await Field.findOneAndUpdate(
      { _id: fieldId, farmerId: userId },
      {
        cropId,
        plantedDate: plantedDate || Date.now(),
        expectedHarvest,
        status: 'Growing',
        health: 85, // Initial health score
      },
      { new: true }
    ).populate('cropId');
    
    if (!field) {
      return res.status(404).json({ message: 'Field not found' });
    }
    
    res.status(200).json({ 
      message: 'Crop planted successfully', 
      field 
    });
  } catch (error) {
    console.error('Update Field Crop Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// routes/fieldRoutes.js - ADD THIS ROUTE
// PUT /api/farm/fields/:fieldId/crop


// PUT /api/farm/fields/:id
exports.updateField = async (req, res) => {
    try {
        const farmerId = getFarmerId(req);
        const fieldId = req.params.id;
        const updates = req.body;

        const updatedField = await Field.findOneAndUpdate(
            { _id: fieldId, farmerId }, // Find by ID and ensure ownership
            updates,
            { new: true, runValidators: true }
        );

        if (!updatedField) {
            return res.status(404).json({ message: 'Field not found or unauthorized' });
        }

        res.status(200).json({ message: 'Field updated successfully', field: updatedField });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error updating field' });
    }
};

// --- 2. Aggregate Stats ---

// GET /api/farm/stats
exports.getFarmStats = async (req, res) => {
    try {
        const farmerId = getFarmerId(req);

        // 1. Calculate Total Area, Active Fields, and Average Health
        const stats = await Field.aggregate([
            { $match: { farmerId: new mongoose.Types.ObjectId(farmerId) } },
            { 
                $group: {
                    _id: null,
                    totalArea: { $sum: '$area' },
                    totalHealth: { $sum: '$healthScore' },
                    fieldCount: { $sum: 1 },
                    activeFields: { $sum: { $cond: [{ $eq: ['$status', 'Growing'] }, 1, 0] } },
                    healthCount: { $sum: { $cond: ['$healthScore', 1, 0] } } // Count fields with a valid health score
                }
            }
        ]);

        const fieldStats = stats[0] || { totalArea: 0, activeFields: 0, fieldCount: 0, totalHealth: 0, healthCount: 0 };
        const avgHealth = fieldStats.healthCount > 0 
            ? Math.round(fieldStats.totalHealth / fieldStats.healthCount) 
            : null;

        // 2. Count Alerts (High/Medium severity)
        const activeAlerts = await Alert.countDocuments({ farmerId, severity: { $in: ['high', 'medium'] } });
        
        // 3. Count Today's Tasks (Due Today, not completed)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todaysTasks = await Task.countDocuments({
            farmerId,
            isCompleted: false,
            dueDate: {
                $gte: today, // Start of today
                $lt: tomorrow // End of today
            }
        });


        res.status(200).json({
            totalArea: fieldStats.totalArea.toFixed(1),
            activeFields: fieldStats.activeFields,
            totalFields: fieldStats.fieldCount,
            avgHealth: avgHealth,
            activeAlerts: activeAlerts,
            todaysTasks: todaysTasks
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error calculating farm statistics' });
    }
};

// --- 3. Task Management ---

// GET /api/farm/tasks/today
exports.getTodaysTasks = async (req, res) => {
    try {
        const farmerId = getFarmerId(req);
        
        // Find tasks due today that are not completed
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const tasks = await Task.find({
            farmerId,
            isCompleted: false,
            dueDate: {
                $gte: today, 
                $lt: tomorrow 
            }
        })
        .sort({ dueDate: 1 })
        .populate('fieldId', 'name'); // Populate the field name for context

        res.status(200).json({ tasks });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error retrieving today's tasks" });
    }
};

// PUT /api/farm/tasks/:id/complete
exports.completeTask = async (req, res) => {
    try {
        const farmerId = getFarmerId(req);
        const taskId = req.params.id;

        const updatedTask = await Task.findOneAndUpdate(
            { _id: taskId, farmerId },
            { isCompleted: true },
            { new: true }
        );

        if (!updatedTask) {
            return res.status(404).json({ message: 'Task not found or unauthorized' });
        }

        res.status(200).json({ message: 'Task marked complete', task: updatedTask });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error completing task' });
    }
};

// --- 4. Expense Tracking ---

// POST /api/farm/expenses
exports.recordExpense = async (req, res) => {
    try {
        const farmerId = getFarmerId(req);
        const { fieldId, category, item, amount, quantity } = req.body;

        if (!category || !item || !amount) {
            return res.status(400).json({ message: 'Category, item, and amount are required.' });
        }

        const newExpense = await Expense.create({
            farmerId,
            fieldId,
            category,
            item,
            amount,
            quantity: quantity || 1
        });

        res.status(201).json({ message: 'Expense recorded successfully', expense: newExpense });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error recording expense' });
    }
};
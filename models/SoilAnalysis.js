const mongoose = require('mongoose');

const soilAnalysisSchema = new mongoose.Schema({
    farmerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Farmer',
        required: true,
    },
    fieldId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Field',
        required: false, // Can be for the entire farm
    },
    dateTested: {
        type: Date,
        required: true,
    },
    // Macronutrients
    nitrogen: { type: String, enum: ['Low', 'Medium', 'High'] },
    phosphorus: { type: String, enum: ['Low', 'Medium', 'High'] },
    potassium: { type: String, enum: ['Low', 'Medium', 'High'] },
    
    // Other properties
    pH: {
        type: Number,
        min: 0,
        max: 14,
    },
    soilType: {
        type: String, // e.g., 'Loamy', 'Clay'
    },
    // Raw JSON data from lab report
    rawData: {
        type: mongoose.Schema.Types.Mixed,
    }
}, { timestamps: true });

module.exports = mongoose.model('SoilAnalysis', soilAnalysisSchema);
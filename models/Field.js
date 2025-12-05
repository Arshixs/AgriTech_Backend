const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
    farmerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Farmer', // Reference to the Farmer model
        required: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    area: {
        type: Number, // In acres
        required: true,
    },
    crop: {
        type: String, // e.g., 'Rice', 'Wheat' (current or planned crop)
        required: true,
    },
    soilType: {
        type: String, // e.g., 'Loamy', 'Clay', 'Sandy Loam'
    },
    status: {
        type: String,
        enum: ['Growing', 'Preparing', 'Harvesting', 'Fallow'],
        default: 'Preparing',
    },
    plantedDate: {
        type: Date,
    },
    expectedHarvest: {
        type: Date,
    },
    healthScore: {
        type: Number, // Percentage 0-100, derived from sensor/analysis data
    },
    irrigationType: {
        type: String, // e.g., 'Drip', 'Sprinkler', 'Flood'
    },
    coordinates: {
        lat: { type: Number },
        lng: { type: Number },
    },
}, { timestamps: true });

module.exports = mongoose.model('Field', fieldSchema);
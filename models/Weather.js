const mongoose = require('mongoose');

const weatherSchema = new mongoose.Schema({
    farmerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Farmer',
        required: true,
        unique: true, // Only one current weather record per farmer
    },
    location: {
        type: String, // e.g., 'Varanasi, UP'
        required: true,
    },
    // Current Conditions (matching alerts.js structure)
    temperature: { type: Number }, // Celsius
    humidity: { type: Number }, // Percentage
    rainfall: { type: Number }, // Millimeters
    windSpeed: { type: Number }, // km/h
    condition: { type: String }, // e.g., 'Partly Cloudy'
    
    dateUpdated: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

module.exports = mongoose.model('Weather', weatherSchema);
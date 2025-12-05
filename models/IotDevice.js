const mongoose = require('mongoose');

const iotDeviceSchema = new mongoose.Schema({
    farmerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Farmer',
        required: true,
        index: true,
    },
    fieldId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Field',
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    type: {
        type: String,
        enum: [
            'soil', 
            'weather', 
            'nutrient', 
            'water', 
            'camera', 
            'pest',
        ],
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['active', 'warning', 'offline', 'error'],
        default: 'active',
    },
    // Device-specific metrics
    battery: { type: Number, min: 0, max: 100 },
    // Latest sensor readings (Flexible structure to hold different types of sensor data)
    readings: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    alerts: [{
        type: String, // e.g., "Low Battery", "High Pest Count"
    }],
    // Metadata for frontend UI (icons, colors, etc.)
    icon: { type: String },
    color: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('IotDevice', iotDeviceSchema);
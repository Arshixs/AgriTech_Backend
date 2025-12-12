const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
    farmerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Farmer',
        required: true,
    },
    type: {
        type: String,
        enum: ['weather', 'disease', 'pest', 'irrigation', 'general'],
        required: true,
    },
    severity: {
        type: String,
        // enum: ['high', 'medium', 'low'],
        default: 'medium',
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    dateGenerated: {
        type: Date,
        default: Date.now,
    },
    // Optional reference to a field or crop this alert pertains to
    fieldId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Field',
    },
    crop: {
        type: String,
    }
}, { timestamps: true });

module.exports = mongoose.model('Alert', alertSchema);
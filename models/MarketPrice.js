const mongoose = require('mongoose');

const marketPriceSchema = new mongoose.Schema({
    crop: {
        type: String,
        required: true,
        index: true,
    },
    date: {
        type: Date,
        required: true,
        index: true,
    },
    price: {
        type: Number, // Price per quintal (or standard unit)
        required: true,
    },
    location: {
        type: String, // Market/Region this price is for
        default: 'Varanasi', // Placeholder location
    },
    unit: {
        type: String,
        default: 'quintal'
    }
}, { timestamps: true });

// Compound index for faster lookups based on crop and date
marketPriceSchema.index({ crop: 1, date: -1 });

module.exports = mongoose.model('MarketPrice', marketPriceSchema);
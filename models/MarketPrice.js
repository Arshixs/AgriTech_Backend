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
    coordinates: {
        type: {
            type: String,
            enum: ['Point'], // Must be 'Point'
            default: 'Point',
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true,
        }
    },
    unit: {
        type: String,
        default: 'quintal'
    }
}, { timestamps: true });

// Compound index for faster lookups based on crop and date
marketPriceSchema.index({ crop: 1, date: -1 });
//Geospatial index for nearby search support
marketPriceSchema.index({ coordinates: "2dsphere" });
// In MongoDB, GeoJSON coordinates must be stored in the order [longitude, latitude].

module.exports = mongoose.model('MarketPrice', marketPriceSchema);
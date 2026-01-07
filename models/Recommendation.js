const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema({
    farmerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Farmer',
        required: true,
    },
    fieldId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Field',
        required: true,
    },
    dateGenerated: {
        type: Date,
        default: Date.now,
    },
    // The analysis result is an array of recommended crops
    crops: [{
        cropName: { type: String, required: true },
        suitability: { type: Number, min: 0, max: 100 },
        season: { type: String },
        expectedYield: { type: String },
        duration: { type: String },
        waterRequirement: { type: String },
        icon: { type: String },
        benefits: [{ type: String }],
        considerations: [{ type: String }],
    }],
    
    basedOnSoilId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SoilAnalysis',
    }
}, { timestamps: true });

recommendationSchema.index({ fieldId: 1, dateGenerated: -1 });

module.exports = mongoose.model('Recommendation', recommendationSchema);
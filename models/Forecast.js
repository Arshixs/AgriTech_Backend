const mongoose = require('mongoose');

const forecastSchema = new mongoose.Schema({
    crop: {
        type: String,
        required: true,
        index: true,
    },
    timeframe: {
        type: String, // e.g., '1month', '3months', '6months'
        required: true,
    },
    dateGenerated: {
        type: Date,
        default: Date.now,
    },
    // Core Prediction Data
    currentPrice: { type: Number },
    predictedPrice: { type: Number },
    change: { type: Number },
    changePercent: { type: Number },
    confidence: { type: Number, min: 0, max: 100 },
    historicalAvg: { type: Number },
    seasonalTrend: { type: String }, // e.g., 'increasing', 'stable'
    
    // Detailed data for the chart (stored as mixed array)
    chartData: [mongoose.Schema.Types.Mixed], 
    
    // Market Factors (matching frontend structure)
    factors: [{
        name: { type: String },
        impact: { type: String, enum: ['high', 'medium', 'low'] },
        trend: { type: String, enum: ['up', 'down', 'stable'] },
    }],
}, { timestamps: true });

// Compound index for fast lookup based on crop and timeframe
forecastSchema.index({ crop: 1, timeframe: 1, dateGenerated: -1 });

module.exports = mongoose.model('Forecast', forecastSchema);
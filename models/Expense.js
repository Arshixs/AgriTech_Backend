const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    farmerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Farmer',
        required: true,
    },
    fieldId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Field',
        required: false,
    },
    category: {
        type: String,
        enum: ['Seed', 'Fertilizer', 'Pesticide', 'Labor', 'Fuel', 'Machinery', 'Other'],
        required: true,
    },
    item: {
        type: String, // Specific item name (e.g., 'Urea', 'Certified Rice Seed')
        required: true,
    },
    amount: {
        type: Number, // Total cost
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    quantity: {
        type: Number,
    }
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
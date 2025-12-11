
// models/CropOutput.js
// ============================================
const mongoose = require('mongoose');

const cropOutputSchema = new mongoose.Schema({
  farmerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  fieldId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Field',
    required: true,
  },
  cropId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CropMaster',
    required: true,
  },
  
  // Harvest Details
  quantity: {
    type: Number,
    required: true,
  },
  unit: {
    type: String,
    enum: ['kg', 'quintal', 'ton'],
    default: 'quintal',
  },
  harvestDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  
  // Storage Information
  storageLocation: String,
  
  // Status Management
  status: {
    type: String,
    enum: ['available', 'listed-for-sale', 'quality-pending', 'quality-approved', 'quality-rejected', 'sold', 'reserved'],
    default: 'available',
  },
  
  // Quality Certification Reference
  qualityRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QualityRequest',
  },
  
  // Sales Reference (for future)
  saleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sale',
  },
  
  // Additional Notes
  notes: String,
  
}, { timestamps: true });

// Index for efficient queries
cropOutputSchema.index({ farmerId: 1, status: 1 });
cropOutputSchema.index({ cropId: 1 });

module.exports = mongoose.model('CropOutput', cropOutputSchema);

// ============================================
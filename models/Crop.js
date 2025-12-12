const mongoose = require('mongoose');

// Crop enum with associated icons
const CROP_ENUM = {
    // Cereals  
    'PADDY_COMMON': { name: 'Paddy (Common)', icon: 'rice' },
    'PADDY_GRADE_A': { name: 'Paddy (Grade A)', icon: 'rice' },
    'WHEAT': { name: 'Wheat', icon: 'wheat' },
    'MAIZE': { name: 'Maize', icon: 'corn' },
    'BARLEY': { name: 'Barley', icon: 'barley' },
    
    // Millets
    'JOWAR_HYBRID': { name: 'Jowar (Hybrid)', icon: 'sorghum' },
    'JOWAR_MALDANDI': { name: 'Jowar (Maldandi)', icon: 'sorghum' },
    'BAJRA': { name: 'Bajra', icon: 'sorghum' },
    'RAGI': { name: 'Ragi', icon: 'food-apple' },
    
    // Pulses
    'ARHAR_TUR': { name: 'Arhar (Tur)', icon: 'sprout' },
    'MOONG': { name: 'Moong', icon: 'seed' },
    'URAD': { name: 'Urad', icon: 'seed' },
    'GRAM': { name: 'Gram', icon: 'seed' },
    'MASUR_LENTIL': { name: 'Masur (Lentil)', icon: 'sprout' },
    
    // Oilseeds
    'GROUNDNUT': { name: 'Groundnut', icon: 'peanut' },
    'SOYABEAN_YELLOW': { name: 'Soyabean (Yellow)', icon: 'soy-sauce' },
    'SUNFLOWER_SEED': { name: 'Sunflower Seed', icon: 'flower' },
    'SESAMUM': { name: 'Sesamum', icon: 'seed-outline' },
    'NIGER_SEED': { name: 'Niger Seed', icon: 'seed-outline' },
    'RAPESEED_MUSTARD': { name: 'Rapeseed/Mustard', icon: 'flower-tulip' },
    'SAFFLOWER': { name: 'Safflower', icon: 'flower-outline' },
    'TORIA': { name: 'Toria', icon: 'flower-tulip' },
    
    // Fiber Crops
    'COTTON_MEDIUM': { name: 'Cotton (Medium Staple)', icon: 'cotton' },
    'COTTON_LONG': { name: 'Cotton (Long Staple)', icon: 'cotton' },
    'JUTE': { name: 'Jute', icon: 'leaf' },
    
    // Commercial Crops
    'SUGARCANE': { name: 'Sugarcane', icon: 'sugar-cube' },
    'COPRA_COCONUT': { name: 'Copra (Coconut)', icon: 'palm-tree' },
    'DEHUSKED_COCONUT': { name: 'De-husked Coconut', icon: 'palm-tree' },
};

// Get crop keys for enum
const CROP_KEYS = Object.keys(CROP_ENUM);

// Helper to get crop display name
const getCropDisplayName = (cropKey) => {
    return CROP_ENUM[cropKey]?.name || cropKey;
};

// Helper to get crop icon
const getCropIcon = (cropKey) => {
    return CROP_ENUM[cropKey]?.icon || 'crop';
};

const cropSchema = new mongoose.Schema({
    // Crop doesn't reference Field since Field already references Crop
    // This is a unidirectional relationship (Field → Crop)
    
    farmerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Farmer',
        required: true,
    },
    cropType: {
        type: String,
        enum: CROP_KEYS,
        required: true,
    },
    cropIcon: {
        type: String,
        default: function() {
            return getCropIcon(this.cropType);
        }
    },
    cropDisplayName: {
        type: String,
        default: function() {
            return getCropDisplayName(this.cropType);
        }
    },
    // Optional - can be used if you want crop-specific area
    // Otherwise, use area from Field model
    area: {
        type: Number, // In acres - OPTIONAL
        min: 0,
    },
    season: {
        type: String,
        enum: ['Kharif', 'Rabi', 'Zaid', 'Year-round'],
    },
    growthDuration: {
        type: Number, // Average days from sowing to harvest
        min: 1,
    },
    waterRequirement: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
    },
    description: {
        type: String,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    // You might want to track crop properties independent of fields
    optimalSoilType: {
        type: [String],
        enum: ['Loamy', 'Clay', 'Sandy', 'Sandy Loam', 'Clay Loam', 'Silty'],
    },
    optimalTemperature: {
        min: { type: Number }, // in °C
        max: { type: Number }, // in °C
    },
    optimalRainfall: {
        min: { type: Number }, // in mm
        max: { type: Number }, // in mm
    }
}, { timestamps: true });

// Virtual for formatted crop info
cropSchema.virtual('cropInfo').get(function() {
    return {
        key: this.cropType,
        name: this.cropDisplayName,
        icon: this.cropIcon,
        ...CROP_ENUM[this.cropType]
    };
});

// Auto-set crop display name and icon before saving
cropSchema.pre('save', function(next) {
    if (this.cropType) {
        if (!this.cropIcon) {
            this.cropIcon = getCropIcon(this.cropType);
        }
        if (!this.cropDisplayName) {
            this.cropDisplayName = getCropDisplayName(this.cropType);
        }
    }
    next();
});

// // Indexes for better performance
// cropSchema.index({ farmerId: 1 });
// cropSchema.index({ cropType: 1 });
// cropSchema.index({ isActive: 1 });
// cropSchema.index({ season: 1 });

module.exports = mongoose.model('Crop', cropSchema);
module.exports.CROP_ENUM = CROP_ENUM;
module.exports.CROP_KEYS = CROP_KEYS;
module.exports.getCropDisplayName = getCropDisplayName;
module.exports.getCropIcon = getCropIcon;
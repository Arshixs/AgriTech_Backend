const Alert = require('../models/Alert');
const SoilAnalysis = require('../models/SoilAnalysis');
const Weather = require('../models/Weather');
const Recommendation = require('../models/Recommendation');
const Forecast = require('../models/Forecast');
const IotDevice = require('../models/IotDevice');

// Utility function to extract farmer ID from the JWT payload
const getFarmerId = (req) => req.user.userId;

// --- 1. Alerts & Weather ---

// GET /api/data/alerts
exports.getFarmerAlerts = async (req, res) => {
    try {
        const farmerId = getFarmerId(req);
        // Find all alerts, sorted by date descending (most recent first)
        const alerts = await Alert.find({ farmerId }).sort({ dateGenerated: -1 });

        res.status(200).json({ alerts });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error retrieving alerts' });
    }
};

// GET /api/data/weather
exports.getCurrentWeather = async (req, res) => {
    try {
        const farmerId = getFarmerId(req);
        // Fetch the single current weather record for this farmer
        const weather = await Weather.findOne({ farmerId });

        if (!weather) {
            // Return a standard error or informative message if no weather data is processed yet
            return res.status(404).json({ message: 'Current weather data not found for this farmer.' });
        }
        
        // Frontend expects 'weather' object directly
        res.status(200).json({ weather });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error retrieving weather data' });
    }
};

// --- 2. Recommendations & Soil ---

// GET /api/data/soil/latest
exports.getLatestSoilData = async (req, res) => {
    try {
        const farmerId = getFarmerId(req);
        
        // Find the most recently submitted soil analysis for the farmer
        const latestSoil = await SoilAnalysis.findOne({ farmerId })
            .sort({ dateTested: -1 })
            .limit(1);

        if (!latestSoil) {
             // Return default/empty structure if no analysis exists
            return res.status(200).json({
                message: 'No soil analysis found.',
                soilData: {
                    pH: null,
                    nitrogen: null,
                    phosphorus: null,
                    potassium: null,
                    soilType: null,
                }
            });
        }
        
        res.status(200).json({ soilData: latestSoil });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error retrieving latest soil analysis' });
    }
};

// GET /api/data/recommendations
exports.getCropRecommendations = async (req, res) => {
    try {
        const farmerId = getFarmerId(req);
        
        // Find the most recently calculated recommendation set
        const recommendationSet = await Recommendation.findOne({ farmerId })
            .sort({ dateGenerated: -1 })
            .limit(1);

        if (!recommendationSet) {
             // Return empty array if no recommendations have been generated
            return res.status(200).json({ 
                message: 'No crop recommendations found.',
                recommendations: [] 
            });
        }
        
        // Frontend expects the array of crops directly
        res.status(200).json({ recommendations: recommendationSet.crops });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error retrieving crop recommendations' });
    }
};

// --- 3. Market Prices ---

// GET /api/data/market/forecast
exports.getPriceForecast = async (req, res) => {
    const { crop, timeframe = '3months' } = req.query;

    if (!crop) {
        return res.status(400).json({ message: 'Crop query parameter is required' });
    }

    try {
        // Find the most recent forecast generated for this specific crop and timeframe
        const marketForecast = await Forecast.findOne({ crop, timeframe })
            .sort({ dateGenerated: -1 })
            .limit(1);

        if (!marketForecast) {
            return res.status(404).json({ message: `Forecast not found for ${crop} over ${timeframe}.` });
        }

        // Frontend expects the forecast data structure directly
        res.status(200).json({ forecast: marketForecast });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error retrieving market price forecast' });
    }
};

// --- IoT Device Management ---

// GET /api/data/iot/devices
exports.getIotDevices = async (req, res) => {
    try {
        const farmerId = getFarmerId(req);
        // Find all devices, sorted by status (warnings first) and then name
        const devices = await IotDevice.find({ farmerId })
            .sort({ status: -1, name: 1 }); // Assuming status 'warning' sorts before 'active'
            
        res.status(200).json({ devices });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error retrieving IoT devices' });
    }
};
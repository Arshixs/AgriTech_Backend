require('dotenv').config();
const Alert = require('../models/Alert');
const SoilAnalysis = require('../models/SoilAnalysis');
const Weather = require('../models/Weather');
const Recommendation = require('../models/Recommendation');
const Forecast = require('../models/Forecast');
const IotDevice = require('../models/IotDevice');
const Farmer = require('../models/Farmer');




// Utility function to extract farmer ID from the JWT payload
const getFarmerId = (req) => req.user.userId;

const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const WEATHER_API_BASE_URL = process.env.WEATHER_API_BASE_URL;

// Helper to map external WeatherAPI data to internal Weather model structure
const mapWeatherResponse = (weatherData) => {
    const current = weatherData.current;
    const location = weatherData.location;

    // Use current API response structure mapping
    return {
        location: `${location.name}, ${location.region}`,
        temperature: current.temp_c,
        humidity: current.humidity,
        // Using precip_mm for rainfall
        rainfall: current.precip_mm, 
        // Using wind_kph for windSpeed
        windSpeed: current.wind_kph, 
        condition: current.condition.text,
        dateUpdated: new Date(),
    };
};

// Helper to map WeatherAPI Alerts (from alerts.json endpoint) to internal Alert model structure
const mapAlertsResponse = (alertsData, farmerId) => {
    // API returns alerts: { alert: [...] }
    const alertsArray = alertsData.alert || [];
    
    return alertsArray.map(alert => ({
        farmerId: farmerId,
        type: 'weather', 
        // Map severity based on the API response field
        severity: alert.severity || 'Moderate', 
        title: alert.headline || 'Weather Alert',
        // Using the detailed description from the API response
        description: alert.desc || alert.note || alert.headline,
        dateGenerated: new Date(alert.effective || Date.now()),
        crop: 'Farm-wide', 
    }));
};

// --- Core Weather Fetch Logic: Live API + Cache Update ---

// This function now only fetches and caches weather, used as a sub-function by both controllers.
async function fetchLiveWeather(farmerId) {
    const farmer = await Farmer.findById(farmerId).select('coordinates address').lean();

    if (!farmer || !farmer.coordinates || !farmer.coordinates.lat || !farmer.coordinates.lng) {
        throw new Error("Farmer profile missing location coordinates.");
    }
    
    const q = `${farmer.coordinates.lat},${farmer.coordinates.lng}`;
    // Use the CURRENT endpoint for minimal data fetch for caching the current state
    const url = `${WEATHER_API_BASE_URL}/current.json?key=${WEATHER_API_KEY}&q=${q}&aqi=no`;

    // 1. Attempt Live Fetch
    const response = await fetch(url);
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`External Current Weather API failed with status ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();

    // 2. Map and Cache Weather Data
    const mappedWeather = mapWeatherResponse(data);
    
    await Weather.findOneAndUpdate(
        { farmerId },
        { $set: mappedWeather },
        { new: true, upsert: true } // Creates or updates the cache
    );

    return mappedWeather;
}


// --- 1. Weather Controller (Updated for Live/Cache Logic) ---

// GET /api/data/weather
exports.getCurrentWeather = async (req, res) => {
    const farmerId = getFarmerId(req);
    let weatherData = null;
    let source = 'cache';

    try {
        // Attempt to fetch live data (Primary Action)
        weatherData = await fetchLiveWeather(farmerId);
        source = 'live';
        
    } catch (liveError) {
        // Live API failed or location was missing (Fallback Action)
        console.warn(`Live fetch/location failed for Farmer ${farmerId}: ${liveError.message}. Falling back to cache.`);

        const cachedWeather = await Weather.findOne({ farmerId }).sort({ dateUpdated: -1 });

        if (cachedWeather) {
            // Use cached data
            weatherData = cachedWeather;
        } else {
            // Failed to fetch live, and no cache exists
            return res.status(503).json({ message: 'Weather service currently unavailable and no cached data exists.' });
        }
    }

    // Return data, guaranteed to be structured correctly
    res.status(200).json({ 
        weather: weatherData,
        source: source
    });
};

// --- 2. Alerts Controller ---

// GET /api/data/alerts
exports.getFarmerAlerts = async (req, res) => {
    const farmerId = getFarmerId(req);
    
    // 1. Attempt to sync alerts from the dedicated API endpoint
    try {
        const farmer = await Farmer.findById(farmerId).select('coordinates').lean();

        if (farmer && farmer.coordinates && farmer.coordinates.lat && farmer.coordinates.lng) {
            const q = `${farmer.coordinates.lat},${farmer.coordinates.lng}`;
            const url = `${WEATHER_API_BASE_URL}/alerts.json?key=${WEATHER_API_KEY}&q=${q}`;
            
            const response = await fetch(url);
            
            if (response.ok) {
                const data = await response.json();
                
                // Process and Store Alerts
                const mappedAlerts = mapAlertsResponse(data.alerts, farmerId);
                
                // Clear existing weather alerts before inserting new ones
                await Alert.deleteMany({ farmerId, type: 'weather' });
                
                if (mappedAlerts.length > 0) {
                    await Alert.insertMany(mappedAlerts);
                }
            } else {
                 console.warn(`External Alerts API failed with status ${response.status}.`);
            }
        }
    } catch (error) {
        console.error("Critical Alert Sync Failure:", error);
    }
    
    // 2. Fetch all current alerts (including any updated weather alerts)
    try {
        const alerts = await Alert.find({ farmerId }).sort({ dateGenerated: -1 });

        res.status(200).json({ alerts });
    } catch (error) {
        console.error("Server Error retrieving alerts:", error);
        res.status(500).json({ message: 'Server Error retrieving alerts' });
    }
};

// --- 2. Recommendations & Soil ---

// GET /api/data/soil/latest
exports.getLatestSoilData = async (req, res) => {
    try {
        const farmerId = getFarmerId(req);
        const { fieldId } = req.query;

        if (!fieldId) {
            return res.status(400).json({ message: 'fieldId is required for specific soil analysis.' });
        }

        // Find the latest soil report specifically for THIS field
        const latestSoil = await SoilAnalysis.findOne({ farmerId, fieldId })
            .sort({ dateTested: -1 });

        if (!latestSoil) {
            return res.status(200).json({
                message: 'No soil analysis found for this field.',
                soilData: null
            });
        }
        
        res.status(200).json({ soilData: latestSoil });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error retrieving soil analysis' });
    }
};

// GET /api/data/recommendations
exports.getCropRecommendations = async (req, res) => {
    try {
        const farmerId = getFarmerId(req);
        const { fieldId } = req.query;
        
        // Find the most recently calculated recommendation set
        const recommendationSet = await Recommendation.findOne({ 
            farmerId, 
            fieldId // Critical fix: Filter by fieldId
        })
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
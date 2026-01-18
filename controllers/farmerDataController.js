require('dotenv').config();
const Alert = require('../models/Alert');
const SoilAnalysis = require('../models/SoilAnalysis');
const Weather = require('../models/Weather');
const Recommendation = require('../models/Recommendation');
const Forecast = require('../models/Forecast');
const IotDevice = require('../models/IotDevice');
const Farmer = require('../models/Farmer');
const Field = require('../models/Field');




// Utility function to extract farmer ID from the JWT payload
const getFarmerId = (req) => req.user.userId;

const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const WEATHER_API_BASE_URL = process.env.WEATHER_API_BASE_URL;

// Helper to map external WeatherAPI data to internal Weather model structure
const mapWeatherResponse = (weatherData, farmerId, fieldId) => {
    const current = weatherData.current;
    const location = weatherData.location;

    // Use current API response structure mapping
    return {
        farmerId,
        fieldId,
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
const mapAlertsResponse = (alertsData, farmerId,fieldId) => {
    // API returns alerts: { alert: [...] }
    const alertsArray = alertsData.alert || [];
    
    return alertsArray.map(alert => ({
        farmerId: farmerId,
        fieldId: fieldId,
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
async function fetchLiveWeather(farmerId, fieldId) {
    
    // Fetch coordinates from the specific Field model instead of the Farmer model
    const field = await Field.findOne({ _id: fieldId, farmerId }).select('coordinates').lean();
    if (!field || !field.coordinates || !field.coordinates.lat || !field.coordinates.lng) {
        throw new Error("Field location coordinates missing.");
    }
    
    const q = `${field.coordinates.lat},${field.coordinates.lng}`;
    
    const url = `${WEATHER_API_BASE_URL}/current.json?key=${WEATHER_API_KEY}&q=${q}&aqi=no`;

    const response = await fetch(url);
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`External Weather API failed: ${errorText}`);
    }
    
    const data = await response.json();
    const mappedWeather = mapWeatherResponse(data, farmerId, fieldId);
    
    await Weather.findOneAndUpdate(
        { fieldId },
        { $set: mappedWeather },
        { new: true, upsert: true }
    );

  return mappedWeather;
}

// --- 1. Weather Controller (Field Level) ---
exports.getCurrentWeather = async (req, res) => {
    const farmerId = getFarmerId(req);
    
    const { fieldId } = req.query;

    if (!fieldId) {
        return res.status(400).json({ message: 'fieldId query parameter is required.' });
    }

    let weatherData = null;
    let source = 'cache';

    try {
        console.log(farmerId);
        console.log(farmerId);
        weatherData = await fetchLiveWeather(farmerId, fieldId);
        source = 'live';
    } catch (liveError) {
        console.warn(`Live fetch failed for Field ${fieldId}: ${liveError.message}. Falling back to cache.`);
        const cachedWeather = await Weather.findOne({ fieldId }).sort({ dateUpdated: -1 });

        if (cachedWeather) {
            weatherData = cachedWeather;
        } else {
            // return res.status(503).json({ message: 'Weather service unavailable for this field and no cache exists.' });
            return res.status(200).json({ 
                weather: { 
                    location: "Connecting to station...", 
                    temperature: "...", 
                    condition: "Initializing", 
                    humidity: "..." 
                },
                source: 'initializing'
            });
        }
    }

    res.status(200).json({ 
        weather: weatherData,
        source: source
    });
};

// --- 2. Alerts Controller (Field Level) ---
exports.getFarmerAlerts = async (req, res) => {
    const farmerId = getFarmerId(req);
    const { fieldId } = req.query;

    if (!fieldId) {
        return res.status(400).json({ message: 'fieldId query parameter is required.' });
    }
    
    try {
        const field = await Field.findOne({ _id: fieldId, farmerId }).select('coordinates').lean();

        if (field && field.coordinates && field.coordinates.lat && field.coordinates.lng) {
            const q = `${field.coordinates.lat},${field.coordinates.lng}`;
            const url = `${WEATHER_API_BASE_URL}/alerts.json?key=${WEATHER_API_KEY}&q=${q}`;
            
            const response = await fetch(url);
            
            if (response.ok) {
                const data = await response.json();
                const mappedAlerts = mapAlertsResponse(data.alerts || {}, farmerId, fieldId);
                
                // Clear existing weather alerts for THIS field before inserting new ones
                await Alert.deleteMany({ fieldId, type: 'weather' });
                
                if (mappedAlerts.length > 0) {
                    await Alert.insertMany(mappedAlerts);
                }
            }
        }
    } catch (error) {
        console.error("Critical Alert Sync Failure:", error);
    }
    
    try {
        // Fetch alerts specific to this field
        const alerts = await Alert.find({ fieldId }).sort({ dateGenerated: -1 });
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
        message: "No crop recommendations found.",
        recommendations: [],
      });
    }

    // Frontend expects the array of crops directly
    res.status(200).json({ recommendations: recommendationSet.crops });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Server Error retrieving crop recommendations" });
  }
};

// --- 3. Market Prices ---

// GET /api/data/market/forecast
// exports.getPriceForecast = async (req, res) => {
//   const { crop, timeframe = "3months" } = req.query;

//   if (!crop) {
//     return res
//       .status(400)
//       .json({ message: "Crop query parameter is required" });
//   }

//   try {
//     // Find the most recent forecast generated for this specific crop and timeframe
//     const marketForecast = await Forecast.findOne({ crop, timeframe })
//       .sort({ dateGenerated: -1 })
//       .limit(1);

//     if (!marketForecast) {
//       return res
//         .status(404)
//         .json({ message: `Forecast not found for ${crop} over ${timeframe}.` });
//     }

//     // Frontend expects the forecast data structure directly
//     res.status(200).json({ forecast: marketForecast });
//   } catch (error) {
//     console.error(error);
//     res
//       .status(500)
//       .json({ message: "Server Error retrieving market price forecast" });
//   }
// };
// controllers/farmerDataController.js

exports.getPriceForecast = async (req, res) => {
  try {
   
    const { crop, district = 'Kanpur', timeframe = '3months' } = req.query;

     const normalizedCrop =
       crop.charAt(0).toUpperCase() + crop.slice(1).toLowerCase();

    if (!crop) {
      return res.status(400).json({ message: 'Crop parameter is required' });
    }

    // Call Python microservice
    const FORECAST_SERVICE_URL = process.env.FORECAST_SERVICE_URL || 'http://localhost:5000';
    
    const response = await fetch(`${FORECAST_SERVICE_URL}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        crop,
        district,
        timeframe
      })
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(response.status).json({ 
        message: error.error || 'Failed to get forecast' 
      });
    }

    const data = await response.json();

    res.json({
      success: true,
      forecast: data.forecast
    });

  } catch (error) {
    console.error('Price Forecast Error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch price forecast',
      error: error.message 
    });
  }
};



// --- IoT Device Management ---

// GET /api/data/iot/devices
exports.getIotDevices = async (req, res) => {
  try {
    const farmerId = getFarmerId(req);
    // Find all devices, sorted by status (warnings first) and then name
    const devices = await IotDevice.find({ farmerId }).sort({
      status: -1,
      name: 1,
    }); // Assuming status 'warning' sorts before 'active'

    res.status(200).json({ devices });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error retrieving IoT devices" });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const farmerId = getFarmerId(req);
    console.log(farmerId);
    // 1. Run both queries in parallel for performance
    const [orders, sales] = await Promise.all([
      // Fetch Expenses (Money Out)
      Order.find({
        farmer: farmerId,
        // You might want to include 'cod' (Cash on Delivery) as valid transactions
        paymentStatus: { $in: ["paid", "cod"] },
      })
        .select("productSnapshot totalAmount createdAt orderType _id")
        .sort({ createdAt: -1 }),

      // Fetch Income (Money In)
      Sale.find({
        farmerId: farmerId,
        status: "sold",
      })
        .populate("cropId", "name") // Populate to get crop name (e.g., "Wheat")
        .select("finalPrice soldDate listedDate cropId quantity unit _id")
        .sort({ soldDate: -1 }),
    ]);

    // console.log(orders);

    // 2. Normalize Orders (Expense)
    const formattedOrders = orders.map((order) => ({
      _id: order._id,
      type: "expense", // To show red color/minus sign in UI
      title: order.productSnapshot?.name || "Vendor Purchase",
      subtitle: `${order.orderType} Order`,
      amount: order.totalAmount,
      date: new Date(order.createdAt),
      status: "completed",
      icon: "shopping-outline", // Icon name for Frontend
    }));

    // 3. Normalize Sales (Income)
    const formattedSales = sales.map((sale) => ({
      _id: sale._id,
      type: "income", // To show green color/plus sign in UI
      title: `Sold ${sale.cropId?.name || "Crop"}`,
      subtitle: `${sale.quantity} ${sale.unit}`,
      amount: sale.finalPrice || 0,
      // Fallback to listedDate if soldDate is missing
      date: new Date(sale.soldDate || sale.listedDate),
      status: "completed",
      icon: "cash", // Icon name for Frontend
    }));

    // 4. Combine and Sort by Date (Newest first)
    const allTransactions = [...formattedOrders, ...formattedSales].sort(
      (a, b) => b.date - a.date
    );

    // 5. Calculate Total Balance (Optional but helpful)
    const totalIncome = formattedSales.reduce(
      (acc, curr) => acc + curr.amount,
      0
    );
    const totalExpense = formattedOrders.reduce(
      (acc, curr) => acc + curr.amount,
      0
    );

    res.status(200).json({
      success: true,
      data: allTransactions,
      summary: {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
      },
    });
  } catch (error) {
    console.error("Transaction Fetch Error:", error);
    res.status(500).json({ message: "Error fetching transactions" });
  }
};

// POST /api/data/iot/sensor-readings (Non-Protected)
exports.receiveSensorData = async (req, res) => {
    try {
        // 1. Extract data from the request body
        // The Python script will send these values
        const { farmerId, fieldId, temperature, humidity } = req.body;

        // 2. Basic Validation
        if (!farmerId || !fieldId || temperature === undefined || humidity === undefined) {
            return res.status(400).json({ 
                message: 'Missing required fields: farmerId, fieldId, temperature, humidity' 
            });
        }

        // 3. Find the specific device
        // We assume the device type is 'weather' for DHT11. 
        // We look for an existing device registered to this field.
        let device = await IotDevice.findOne({ 
            farmerId: farmerId, 
            fieldId: fieldId,
            type: 'weather' 
        });

        // 4. Handle "Device Not Found" 
        // (Option A: Return 404 - Device must be created in Dashboard first)
        if (!device) {
             // Optional: You could Create one on the fly here, but Schema requires 'name' and 'location'.
             // We will attempt to update the first available device or error out.
             return res.status(404).json({ 
                 message: 'No registered weather device found for this field. Please register device in dashboard first.' 
             });
        }

        // 5. Update the Device
        device.readings = {
            temperature: parseFloat(temperature),
            humidity: parseFloat(humidity),
            lastReceived: new Date()
        };
        
        // Update status to active since we just got a signal
        device.status = 'active'; 
        
        // Simple Alert Logic (Optional)
        device.alerts = []; // Clear old alerts
        if (parseFloat(temperature) > 40) {
            device.status = 'warning';
            device.alerts.push("High Temperature Warning");
        }

        await device.save();

        console.log(`📡 Sensor data received for Field ${fieldId}: ${temperature}°C, ${humidity}%`);

        return res.status(200).json({ success: true, message: 'Data updated successfully' });

    } catch (error) {
        console.error("IoT Ingestion Error:", error);
        return res.status(500).json({ message: 'Server Error processing sensor data' });
    }
};
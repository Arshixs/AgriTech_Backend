const Farmer = require("../models/Farmer");
const Field = require("../models/Field");
const SoilAnalysis = require("../models/SoilAnalysis");
const MSP = require("../models/MSP");
const MarketPrice = require("../models/MarketPrice");
const CropMaster = require("../models/CropMaster");

/**
 * Predicts Crop Profitability based on Expenses vs (MSP or Market Revenue)
 * Uses Geospatial queries to find the nearest market prices.
 */
exports.predictCropProfitability = async (req, res) => {
  try {
    const { userId } = req.user;
    const { crop, area, fieldId, useSoilData } = req.query;

    const landArea = parseFloat(area) || 1;

    // 1. FETCH CROP METADATA
    const cropInfo = await CropMaster.findOne({
      cropName: { $regex: new RegExp(crop, "i") },
    });

    // 2. EXPENSE CALCULATION (THE OUTFLOW)
    const baseRatesPerAcre = {
      seeds: 2500,
      fertilizers: 4000,
      pesticides: 1800,
      irrigation: 1200,
      labor: 4500,
      machinery: 2500,
    };

    let currentRates = { ...baseRatesPerAcre };

    // Handle Soil Sync
    let soilApplied = false;
    if (useSoilData === "true" && fieldId) {
      const soil = await SoilAnalysis.findOne({
        farmerId: userId,
        fieldId,
      }).sort({ dateTested: -1 });

      if (soil) {
        soilApplied = true;
        if (soil.nitrogen === "Low") currentRates.fertilizers *= 1.25;
        if (soil.phosphorus === "Low") currentRates.fertilizers *= 1.15;
        if (soil.potassium === "Low") currentRates.fertilizers *= 1.1;
      }
    }

    const totalPerAcre = Object.values(currentRates).reduce((a, b) => a + b, 0);
    const totalEstimatedExpense = totalPerAcre * landArea;

    // 3. REVENUE PROJECTION (THE INFLOW)
    const farmer = await Farmer.findById(userId).select("coordinates");

    // A. Fetch MSP
    const mspEntry = await MSP.findOne({
      cropName: { $regex: new RegExp(crop, "i") },
      isActive: true,
    });

    // B. Fetch Nearby Market Price using Geospatial Query
    let regionalPrice = null;
    if (
      farmer &&
      farmer.coordinates &&
      farmer.coordinates.lng &&
      farmer.coordinates.lat
    ) {
      regionalPrice = await MarketPrice.findOne({
        crop: { $regex: new RegExp(crop, "i") },
        coordinates: {
          $near: {
            $geometry: {
              type: "Point",
              // MongoDB GeoJSON uses [longitude, latitude]
              coordinates: [farmer.coordinates.lng, farmer.coordinates.lat],
            },
            // Optional: Limit search to 100km (in meters)
            $maxDistance: 100000,
          },
        },
      }).sort({ date: -1 });
    } else {
      // Fallback to most recent price if farmer coordinates are missing
      regionalPrice = await MarketPrice.findOne({
        crop: { $regex: new RegExp(crop, "i") },
      }).sort({ date: -1 });
    }

    // C. Yield Estimation
    const avgYieldPerAcre = cropInfo?.duration ? 18 : 15;
    const totalExpectedYield = avgYieldPerAcre * landArea;

    const expectedRevenueMSP = mspEntry
      ? mspEntry.price * totalExpectedYield
      : null;
    const expectedRevenueMarket = regionalPrice
      ? regionalPrice.price * totalExpectedYield
      : expectedRevenueMSP
      ? expectedRevenueMSP * 1.15
      : null;

    // 4. PREPARE RESPONSE
    res.status(200).json({
      prediction: {
        crop: cropInfo?.cropName || crop,
        total: totalEstimatedExpense,
        perAcre: totalPerAcre,
        breakdown: {
          seeds: currentRates.seeds * landArea,
          fertilizers: currentRates.fertilizers * landArea,
          pesticides: currentRates.pesticides * landArea,
          irrigation: currentRates.irrigation * landArea,
          labor: currentRates.labor * landArea,
          machinery: currentRates.machinery * landArea,
        },
        expectedYield: totalExpectedYield,
        expectedRevenueMSP,
        expectedRevenueMarket,
        metadata: {
          soilDataApplied: soilApplied,
          locationUsed: regionalPrice?.location || "National Average",
          yieldPerAcre: avgYieldPerAcre,
          isLocalized: !!regionalPrice,
        },
      },
    });
  } catch (error) {
    console.error("Expense Prediction Error:", error);
    res
      .status(500)
      .json({ message: "Unable to generate prediction at this time." });
  }
};

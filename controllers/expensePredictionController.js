const Farmer = require("../models/Farmer");
const Field = require("../models/Field");
const SoilAnalysis = require("../models/SoilAnalysis");
const MSP = require("../models/MSP");
const MarketPrice = require("../models/MarketPrice");
const CropMaster = require("../models/CropMaster");

/**
 * Predicts Crop Profitability based on Expenses vs (MSP or Market Revenue)
 * Uses Geospatial Aggregation to find average market prices within a radius.
 */
exports.predictCropProfitability = async (req, res) => {
  try {
    const { userId } = req.user;
    const { crop, area, fieldId, useSoilData } = req.query;

    const landArea = parseFloat(area) || 1;
    const searchRadiusInMeters = 100000; // 100km

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

    // 3. LOCATION RETRIEVAL (Field first, then Farmer)
    let userCoords = null;
    const field = fieldId ? await Field.findById(fieldId).select("coordinates") : null;
    
    if (field?.coordinates?.lat && field?.coordinates?.lng) {
      userCoords = field.coordinates;
    } else {
      const farmer = await Farmer.findById(userId).select("coordinates");
      if (farmer?.coordinates?.lat && farmer?.coordinates?.lng) {
        userCoords = farmer.coordinates;
      }
    }

    // 4. REVENUE PROJECTION (Average Market Price via Geospatial Aggregation)
    
    // A. Fetch MSP
    const mspEntry = await MSP.findOne({
      cropName: { $regex: new RegExp(crop, "i") },
      isActive: true,
    });

    // B. Calculate Average Regional Market Price
    let avgMarketPrice = null;
    let locationLabel = "National Average";

    if (userCoords) {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 60); // Look at prices from last 60 days

      const stats = await MarketPrice.aggregate([
        {
          $geoNear: {
            near: { type: "Point", coordinates: [userCoords.lng, userCoords.lat] },
            distanceField: "dist",
            maxDistance: searchRadiusInMeters,
            query: { 
              crop: { $regex: new RegExp(crop, "i") },
              date: { $gte: recentDate }
            },
            spherical: true,
          },
        },
        {
          $group: {
            _id: null,
            averagePrice: { $avg: "$price" },
            count: { $sum: 1 },
            latestLocation: { $last: "$location" }
          },
        },
      ]);

      if (stats.length > 0) {
        avgMarketPrice = stats[0].averagePrice;
        locationLabel = `Avg of ${stats[0].count} nearby markets`;
      }
    }

    // Fallback if no nearby prices found
    if (!avgMarketPrice) {
      const fallbackPrice = await MarketPrice.findOne({
        crop: { $regex: new RegExp(crop, "i") },
      }).sort({ date: -1 });
      avgMarketPrice = fallbackPrice?.price;
      // avgMarketPrice = fallbackPrice?.price || (mspEntry ? mspEntry.price * 1.1 : 0);
      locationLabel = fallbackPrice ? `${fallbackPrice.location} (Latest)` : "Market Estimate";
    }

    // 5. FINAL CALCULATION
    const avgYieldPerAcre = cropInfo?.avgYieldPerAcre || 11;
    const totalExpectedYield = avgYieldPerAcre * landArea;

    const expectedRevenueMSP = mspEntry ? mspEntry.price * totalExpectedYield : null;
    const expectedRevenueMarket = avgMarketPrice * totalExpectedYield;

    res.status(200).json({
      prediction: {
        crop: cropInfo?.cropName || crop,
        totalExpense: totalEstimatedExpense,
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
          avgMarketPrice: avgMarketPrice,
          locationUsed: locationLabel,
          yieldPerAcre: avgYieldPerAcre,
          recommendedChannel: (expectedRevenueMarket > (expectedRevenueMSP || 0)) ? "Marketplace" : "Government (MSP)"
        },
      },
    });
  } catch (error) {
    console.error("Expense Prediction Error:", error);
    res.status(500).json({ message: "Unable to generate prediction at this time." });
  }
};
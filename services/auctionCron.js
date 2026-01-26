// services/auctionCron.js
const cron = require("node-cron");
const Sale = require("../models/Sale");
const Bid = require("../models/Bid");
const CropOutput = require("../models/CropOutput");
const Farmer = require("../models/Farmer");
const CropMaster = require("../models/CropMaster");
const MarketPrice = require("../models/MarketPrice");

const checkAuctionStatus = async (io) => {
  console.log("⏳ Running Auction Status Check...");
  try {
    const now = new Date();

    // Find expired auctions
    const expiredSales = await Sale.find({
      saleType: "marketplace",
      status: "active",
      auctionEndDate: { $lt: now },
    })
      .populate("cropId", "cropName")
      .populate("farmerId", "address coordinates");

    // Debug log - remove after fixing
    if (expiredSales.length > 0) {
      console.log("Debug - First sale data:", {
        hasCropId: !!expiredSales[0].cropId,
        cropName: expiredSales[0].cropId?.cropName,
        hasFarmerId: !!expiredSales[0].farmerId,
        farmerCoords: expiredSales[0].farmerId?.coordinates,
      });
    }

    if (expiredSales.length === 0) {
      console.log("✓ No expired auctions found.");
    } else {
      console.log(
        `Found ${expiredSales.length} expired auctions. Processing...`
      );

      for (const sale of expiredSales) {
        if (sale.totalBids > 0) {
          // ✅ SOLD - Update sale
          sale.status = "sold";
          sale.soldTo = sale.highestBidder;
          sale.soldToModel = "Buyer";
          sale.soldDate = now;
          sale.finalPrice = sale.currentHighestBid;
          await sale.save();

          // Update crop output status
          await CropOutput.findByIdAndUpdate(sale.cropOutputId, {
            status: "sold",
          });

          // Update all bids for this sale
          await Bid.updateMany(
            { saleId: sale._id, status: "active" },
            { status: "lost" }
          );

          // Mark winning bid
          await Bid.findOneAndUpdate(
            {
              saleId: sale._id,
              buyerId: sale.highestBidder,
              amount: sale.currentHighestBid,
            },
            { status: "won" }
          );

          // Create market price record
          try {
            // Check if we have required data
            if (
              sale.cropId?.cropName &&
              sale.farmerId?.coordinates?.lat &&
              sale.farmerId?.coordinates?.lng
            ) {
              const marketPrice = new MarketPrice({
                crop: sale.cropId.cropName,
                date: sale.soldDate,
                price: sale.finalPrice,
                location: sale.farmerId.address || "Unknown",
                // Convert to GeoJSON format if needed
                coordinates: {
                  type: "Point",
                  coordinates: [
                    sale.farmerId.coordinates.lng,
                    sale.farmerId.coordinates.lat,
                  ],
                },
                unit: sale.unit,
              });
              await marketPrice.save();
              console.log(
                `📊 Market price recorded for ${sale.cropId.cropName}`
              );
            } else {
              console.warn(
                `⚠️ Skipping market price - missing data for sale ${sale._id}`
              );
            }
          } catch (priceError) {
            console.error(
              `❌ Failed to create market price for sale ${sale._id}:`,
              priceError.message
            );
            // Don't fail the entire auction process if market price fails
          }

          // Emit socket event
          if (io) {
            io.to(`sale-${sale._id}`).emit("auction-ended", {
              saleId: sale._id,
              status: "sold",
              winner: sale.highestBidder,
              finalPrice: sale.finalPrice,
            });
          }

          console.log(
            `✅ Sale ${sale._id} marked as SOLD to ${sale.highestBidder} for ${sale.finalPrice}`
          );
        } else {
          // ❌ UNSOLD - Release crop back to marketplace
          sale.status = "unsold";
          await sale.save();

          await CropOutput.findByIdAndUpdate(sale.cropOutputId, {
            status: "available",
            $unset: { saleId: 1 },
          });

          // Emit socket event
          if (io) {
            io.to(`sale-${sale._id}`).emit("auction-ended", {
              saleId: sale._id,
              status: "unsold",
            });
          }

          console.log(`❌ Sale ${sale._id} marked as UNSOLD. Crop released.`);
        }
      }
    }

    // Activate pending auctions that should now be active
    const activatedCount = await Sale.updateMany(
      { status: "pending", auctionStartDate: { $lte: now } },
      { $set: { status: "active" } }
    );

    if (activatedCount.modifiedCount > 0) {
      console.log(
        `✓ Activated ${activatedCount.modifiedCount} pending auctions`
      );
    }
  } catch (error) {
    console.error("❌ Error in Auction Cron Job:", error);
  }
};

const startAuctionCron = (io) => {
  // Run every minute
  cron.schedule("*/1 * * * *", () => {
    checkAuctionStatus(io);
  });

  console.log("✓ Cron Job Initialized: Checking auctions every minute.");
};

module.exports = startAuctionCron;

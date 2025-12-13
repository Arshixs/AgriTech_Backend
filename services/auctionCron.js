// services/auctionCron.js
const cron = require("node-cron");
const Sale = require("../models/Sale");
const Bid = require("../models/Bid");
const CropOutput = require("../models/CropOutput");

const checkAuctionStatus = async () => {
  console.log("⏳ Running Auction Status Check...");

  try {
    const now = new Date();

    // Find all 'active' sales where the End Date has passed
    const expiredSales = await Sale.find({
      saleType: "marketplace",
      status: "active",
      auctionEndDate: { $lt: now },
    });

    if (expiredSales.length === 0) {
      console.log("No expired auctions found.");
    } else {
      console.log(
        `Found ${expiredSales.length} expired auctions. Processing...`
      );

      for (const sale of expiredSales) {
        // ====================================================
        // CASE 1: TIME OVER + BIDS EXIST -> MARK AS SOLD
        // ====================================================
        if (sale.totalBids > 0) {
          // 1. Update Sale Status
          sale.status = "sold";
          sale.soldTo = sale.highestBidder;
          sale.soldToModel = "Buyer";
          sale.soldDate = now;
          sale.finalPrice = sale.currentHighestBid;
          await sale.save();

          // 2. Update CropOutput Status
          await CropOutput.findByIdAndUpdate(sale.cropOutputId, {
            status: "sold",
          });

          // 3. Update Bids (Winner vs Losers)
          // Mark ALL bids for this sale as 'lost' first
          await Bid.updateMany({ saleId: sale._id }, { status: "lost" });

          // Mark the specific winning bid as 'won'
          // We find the bid by the saleId, highest bidder ID, and the winning amount
          await Bid.findOneAndUpdate(
            {
              saleId: sale._id,
              buyerId: sale.highestBidder,
              amount: sale.currentHighestBid,
            },
            { status: "won" }
          );

          console.log(
            `✅ Sale ${sale._id} marked as SOLD to ${sale.highestBidder}`
          );
        }

        // ====================================================
        // CASE 2: TIME OVER + NO BIDS -> MARK AS UNSOLD
        // ====================================================
        else {
          // 1. Update Sale Status
          sale.status = "unsold";
          await sale.save();

          // 2. Update CropOutput (Release it back to farmer?)
          // If we set it to 'available', the farmer can list it again immediately.
          await CropOutput.findByIdAndUpdate(sale.cropOutputId, {
            saleType: "marketplace",
            status: "available",
            $unset: { saleId: 1 }, // Remove link to the failed sale
          });

          console.log(
            `❌ Sale ${sale._id} marked as UNSOL// <--- IMPORT THISD. Crop released.`
          );
        }
      }
    }
    // ====================================================
    // CASE 0: TIME START -> MARK AS ACTIVE
    // ====================================================
    await Sale.updateMany(
      { status: "pending", auctionStartDate: { $lte: now } },
      { $set: { status: "active" } }
    );
    console.log("updated pending to active");
  } catch (error) {
    console.error("Error in Auction Cron Job:", error);
  }
};

// ==================================================================
// SCHEDULING
// ==================================================================

// Schedule the task.
// '0 0 * * *' runs every day at Midnight (00:00).
// '*/1 * * * *' runs every minute (Good for testing).
// '0 * * * *' runs every hour.

const startAuctionCron = () => {
  // Currently set to run every hour to be safe, or set to '0 0 * * *' for midnight
  cron.schedule("*/1 * * * *", () => {
    checkAuctionStatus();
  });

  console.log("Cron Job Initialized: Checking auctions Every minute.");
};

module.exports = startAuctionCron;

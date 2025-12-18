// services/auctionCron.js
const cron = require("node-cron");
const Sale = require("../models/Sale");
const Bid = require("../models/Bid");
const CropOutput = require("../models/CropOutput");

const checkAuctionStatus = async (io) => {
  console.log("⏳ Running Auction Status Check...");

  try {
    const now = new Date();

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
        if (sale.totalBids > 0) {
          sale.status = "sold";
          sale.soldTo = sale.highestBidder;
          sale.soldToModel = "Buyer";
          sale.soldDate = now;
          sale.finalPrice = sale.currentHighestBid;
          await sale.save();

          await CropOutput.findByIdAndUpdate(sale.cropOutputId, {
            status: "sold",
          });

          await Bid.updateMany({ saleId: sale._id }, { status: "lost" });
          await Bid.findOneAndUpdate(
            {
              saleId: sale._id,
              buyerId: sale.highestBidder,
              amount: sale.currentHighestBid,
            },
            { status: "won" }
          );

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
            `✅ Sale ${sale._id} marked as SOLD to ${sale.highestBidder}`
          );
        } else {
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

    await Sale.updateMany(
      { status: "pending", auctionStartDate: { $lte: now } },
      { $set: { status: "active" } }
    );
    console.log("updated pending to active");
  } catch (error) {
    console.error("Error in Auction Cron Job:", error);
  }
};

const startAuctionCron = (io) => {
  cron.schedule("*/1 * * * *", () => {
    checkAuctionStatus(io);
  });

  console.log("Cron Job Initialized: Checking auctions Every minute.");
};

module.exports = startAuctionCron;

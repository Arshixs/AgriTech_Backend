const Bid = require("../models/Bid");
const Sale = require("../models/Sale");

// Place a Bid
exports.placeBid = async (req, res) => {
  try {
    const buyerId = req.user.id || req.user.buyerId; // adapt to your auth
    let { saleId, amount } = req.body;
    amount = parseFloat(amount);

    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: "Invalid bid amount" });
    }

    // Fetch current sale (single read to validate time & status)
    const sale = await Sale.findById(saleId).lean();
    if (!sale) return res.status(404).json({ message: "Listing not found" });

    const now = new Date();
    if (now < new Date(sale.auctionStartDate)) {
      return res.status(400).json({ message: "Bidding has not started yet" });
    }
    if (now > new Date(sale.auctionEndDate)) {
      return res
        .status(400)
        .json({ message: "Bidding has ended for this item" });
    }
    if (sale.status !== "active") {
      return res.status(400).json({ message: "Auction not active" });
    }

    // Determine minimum allowed bid
    const minIncrement = 50;
    const currentRef =
      sale.totalBids === 0 ? sale.minimumPrice || 0 : sale.currentHighestBid;
    const minValidBid =
      sale.totalBids === 0 ? sale.minimumPrice : currentRef + minIncrement;

    if (sale.totalBids === 0) {
      if (amount < sale.minimumPrice) {
        return res.status(400).json({
          message: `First bid must be at least ₹${sale.minimumPrice}`,
        });
      }
    } else {
      if (amount < minValidBid) {
        return res.status(400).json({
          message: `Bid too low. Must be at least ₹${minValidBid}`,
        });
      }
    }

    // Atomic conditional update on sale: only update if currentHighestBid < amount
    const update = {
      $set: { currentHighestBid: amount, highestBidder: buyerId },
      $inc: { totalBids: 1 },
    };

    const updatedSale = await Sale.findOneAndUpdate(
      { _id: saleId, currentHighestBid: { $lt: amount }, status: "active" },
      update,
      { new: true }
    );

    if (!updatedSale) {
      // means someone else beat this bid concurrently, respond with latest info
      const fresh = await Sale.findById(saleId).lean();
      return res.status(409).json({
        message: "Your bid was not high enough (race condition). Try again.",
        currentHighest: fresh.currentHighestBid,
      });
    }

    // Save the Bid document (after sale update)
    const bid = await Bid.create({
      saleId,
      buyerId: buyerId,
      amount,
    });

    // populate buyerId info for emitting
    await bid.populate("buyerId", "name companyName contactPerson");

    // Emit socket event
    const io = req.app.get("io");
    if (io) {
      io.to(`sale-${saleId}`).emit("new-bid", {
        saleId,
        bid: {
          _id: bid._id,
          amount: bid.amount,
          buyerId: {
            name:
              bid.buyerId?.companyName ||
              bid.buyerId?.contactPerson ||
              bid.buyerId?.name ||
              "Anonymous",
            _id: bid.buyerId?._id,
          },
          createdAt: bid.createdAt,
        },
        currentHighestBid: amount,
        highestBidder: buyerId,
        totalBids: updatedSale.totalBids,
      });
    }

    return res
      .status(201)
      .json({ message: "Bid placed successfully", currentHighest: amount });
  } catch (err) {
    console.error("Place Bid Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get Bids for a specific Sale
exports.getBidsForSale = async (req, res) => {
  try {
    const { saleId } = req.params;
    const bids = await Bid.find({ saleId })
      .populate("buyerId", "companyName contactPerson")
      .sort({ amount: -1 });

    res.status(200).json({ bids });
  } catch (error) {
    res.status(500).json({ message: "Server Error fetching bids" });
  }
};

// Get Bids for a specific Sale
exports.getMyBids = async (req, res) => {
  try {
    const { buyerId } = req.user;

    const bids = await Bid.find({ buyerId })
      .populate("saleId")
      .sort({ amount: -1 });

    res.status(200).json({ bids });
  } catch (error) {
    res.status(500).json({ message: "Server Error fetching bids" });
  }
};

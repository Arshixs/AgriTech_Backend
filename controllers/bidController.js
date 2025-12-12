const Bid = require("../models/Bid");
const Sale = require("../models/Sale");

// Place a Bid
exports.placeBid = async (req, res) => {
  try {
    const { buyerId } = req.user; // Authenticated Buyer
    const { saleId, amount } = req.body;

    const sale = await Sale.findById(saleId);
    if (!sale) return res.status(404).json({ message: "Listing not found" });

    // 2. Time Validation
    const now = new Date();
    if (now < sale.auctionStartDate) {
      return res.status(400).json({
        message: `Bidding has not started yet. Starts on ${sale.auctionStartDate.toDateString()}`,
      });
    }
    if (now > sale.auctionEndDate) {
      return res
        .status(400)
        .json({ message: "Bidding has ended for this item" });
    }

    // 3. Amount Validation
    // Determine the floor price for this bid
    // If 0 bids, floor is Minimum Price
    // If >0 bids, floor is Highest Bid
    const currentRefPrice =
      sale.totalBids === 0 ? sale.minimumPrice : sale.currentHighestBid;

    // Define minimum increment (e.g., ₹50)
    const minIncrement = 50;
    const minValidBid = currentRefPrice + minIncrement;

    // Special case: If it's the VERY FIRST bid, allow bidding exactly the minimum price?
    // Usually auctions start AT the base price.
    // Let's say if totalBids=0, you can bid minimumPrice or higher.
    // If totalBids > 0, you must bid higher + increment.

    let isValidBid = false;
    let msg = "";

    if (sale.totalBids === 0) {
      if (amount >= sale.minimumPrice) isValidBid = true;
      else
        msg = `First bid must be at least the starting price of ₹${sale.minimumPrice}`;
    } else {
      if (amount >= minValidBid) isValidBid = true;
      else
        msg = `Bid too low. Must be at least ₹${minValidBid} (Current Highest + ₹${minIncrement})`;
    }

    if (!isValidBid) {
      return res
        .status(400)
        .json({ message: msg, currentHighest: sale.currentHighestBid });
    }

    // 4. Create Bid
    const bid = new Bid({
      saleId,
      buyerId,
      amount,
      status: "active",
    });
    await bid.save();

    // 5. Update Sale
    sale.currentHighestBid = amount;
    sale.highestBidder = buyerId;
    sale.totalBids += 1;
    await sale.save();

    res
      .status(201)
      .json({ message: "Bid placed successfully", currentHighest: amount });
  } catch (error) {
    console.error("Place Bid Error:", error);
    res.status(500).json({ message: "Server Error placing bid" });
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
      .populate("farmerId cropOutputId cropId")
      .sort({ amount: -1 });

    res.status(200).json({ bids });
  } catch (error) {
    res.status(500).json({ message: "Server Error fetching bids" });
  }
};

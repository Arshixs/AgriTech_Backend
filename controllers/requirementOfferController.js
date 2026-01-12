const RequirementOffer = require("../models/RequirementOffer");
const BuyerRequirement = require("../models/BuyerRequirement");

// 1. CREATE OFFER (Farmer Side)
exports.createOffer = async (req, res) => {
  try {
    const { userId, role } = req.user;
    console.log(`Hello world farmerID: ${userId} :: ${role}`);

    // Ensure only farmers can offer
    if (role !== "farmer") {
      return res.status(403).json({ message: "Only farmers can make offers." });
    }

    const {
      requirementId,
      buyerId,
      pricePerUnit,
      quantity,
      availableDate,
      message,
    } = req.body;

    // Check if requirement exists and is active
    const requirement = await BuyerRequirement.findById(requirementId);
    if (!requirement || requirement.status !== "active") {
      return res
        .status(400)
        .json({ message: "Requirement not found or no longer active." });
    }

    // Create the Offer
    const offer = new RequirementOffer({
      requirement: requirementId,
      buyer: requirement.buyer,
      farmer: userId,
      pricePerUnit,
      quantity,
      availableDate,
      message,
    });

    await offer.save();

    // Increment offers count on the Requirement
    await BuyerRequirement.findByIdAndUpdate(requirementId, {
      $inc: { totalOffersReceived: 1 },
    });

    res.status(201).json({ message: "Offer sent successfully!", offer });
  } catch (error) {
    console.error("Create Offer Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// 2. GET OFFERS FOR A REQUIREMENT (Buyer Side)
exports.getOffersForRequirement = async (req, res) => {
  try {
    const { buyerId } = req.user;
    const { requirementId } = req.params;

    // Verify ownership
    const requirement = await BuyerRequirement.findOne({
      _id: requirementId,
      buyer: buyerId,
    });
    if (!requirement) {
      return res
        .status(403)
        .json({ message: "Access denied or requirement not found." });
    }

    const offers = await RequirementOffer.find({
      requirement: requirementId,
      status: { $ne: "cancelled" },
    })
      .populate("farmer", "name phone address profileImage")
      .sort({ createdAt: -1 });

    res.status(200).json({ offers });
  } catch (error) {
    console.error("Get Offers Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// 3. GET MY OFFERS (Farmer Side)
exports.getMyOffers = async (req, res) => {
  try {
    const { userId, role } = req.user;

    // ✅ Add role check
    if (role !== "farmer") {
      return res.status(403).json({ message: "Access denied" });
    }

    const offers = await RequirementOffer.find({ farmer: userId })
      .populate("requirement", "cropName category quantity unit")
      .populate("buyer", "companyName phone")
      .sort({ createdAt: -1 });

    res.status(200).json({ offers });
  } catch (error) {
    console.error("Get My Offers Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// 4. ACCEPT / REJECT OFFER (Buyer Side)
exports.updateOfferStatus = async (req, res) => {
  try {
    const { buyerId } = req.user;
    const { offerId } = req.params;
    const { status } = req.body;

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const offer = await RequirementOffer.findOne({
      _id: offerId,
      buyer: buyerId,
      status: "pending", // ✅ Only update pending offers
    });

    if (!offer) {
      return res.status(404).json({
        message: "Offer not found or already processed",
      });
    }

    if (status === "accepted") {
      // ✅ Check if requirement is still active
      const buyerRequirement = await BuyerRequirement.findOne({
        _id: offer.requirement,
        status: "active",
      });

      if (!buyerRequirement) {
        return res.status(400).json({
          message: "Requirement is no longer active",
        });
      }

      // Update requirement
      buyerRequirement.status = "fulfilled";
      buyerRequirement.fulfilledBy = offer.farmer;
      await buyerRequirement.save();

      // Reject all other offers
      await RequirementOffer.updateMany(
        {
          requirement: offer.requirement,
          _id: { $ne: offer._id },
          status: "pending",
        },
        {
          $set: { status: "rejected" },
        }
      );
    }

    offer.status = status;
    await offer.save();

    res.status(200).json({ message: `Offer ${status} successfully`, offer });
  } catch (error) {
    console.error("Update Status Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// 5. CANCEL OFFER (Farmer Side)
exports.cancelOffer = async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { offerId } = req.params;

    // ✅ Add role check
    if (role !== "farmer") {
      return res
        .status(403)
        .json({ message: "Only farmers can cancel offers" });
    }

    // ✅ Add farmer ownership check
    const offer = await RequirementOffer.findOne({
      _id: offerId,
      farmer: userId,
      status: "pending", // ✅ Only cancel pending offers
    });

    if (!offer) {
      return res.status(404).json({
        message: "Offer not found or cannot be cancelled",
      });
    }

    offer.status = "cancelled";
    await offer.save();

    // ✅ Decrement offer count
    await BuyerRequirement.findByIdAndUpdate(offer.requirement, {
      $inc: { totalOffersReceived: -1 },
    });

    res.status(200).json({ message: "Offer cancelled successfully", offer });
  } catch (error) {
    console.error("Cancel Offer Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

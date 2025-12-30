const BuyerRequirement = require("../models/BuyerRequirement");

// 1. POST A REQUIREMENT (Updated for Pre-Harvest Fields)
exports.createRequirement = async (req, res) => {
  try {
    const { buyerId, role } = req.user;

    if (role !== "buyer") {
      return res
        .status(403)
        .json({ message: "Access denied. Only buyers can post requirements." });
    }

    // Extract new fields based on the updated model
    const {
      cropName,
      category,
      variety,
      quantity,
      unit,
      targetPrice,
      isNegotiable,
      contractType,
      requiredByDate,
      listingExpiresAt,
      qualityGrade,
      description,
      deliveryLocation, // Expecting object: { address, city, state, pinCode }
      logisticsType,
    } = req.body;

    // Basic validation
    if (
      !cropName ||
      !quantity ||
      !targetPrice ||
      !requiredByDate ||
      !contractType
    ) {
      return res
        .status(400)
        .json({ message: "Please fill in all required fields." });
    }

    const requirement = new BuyerRequirement({
      buyer: buyerId,
      cropName,
      category,
      variety,
      quantity,
      unit,
      targetPrice,
      isNegotiable: isNegotiable !== undefined ? isNegotiable : true,
      contractType,
      requiredByDate,
      listingExpiresAt, // Optional, model middleware will handle default if null
      qualityGrade,
      description,
      deliveryLocation,
      logisticsType,
    });

    const savedRequirement = await requirement.save();

    res.status(201).json({
      message: "Requirement posted successfully",
      requirement: savedRequirement,
    });
  } catch (error) {
    console.error("Create Requirement Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// 2. GET MY REQUIREMENTS (Buyer Dashboard)
exports.getMyRequirements = async (req, res) => {
  try {
    const { buyerId } = req.user;
    const { status } = req.query;

    let query = { buyer: buyerId };

    // Optional filter by status (e.g. ?status=active)
    if (status) {
      query.status = status;
    }

    const requirements = await BuyerRequirement.find(query).sort({
      createdAt: -1,
    });

    res.status(200).json({
      count: requirements.length,
      requirements,
    });
  } catch (error) {
    console.error("Get Requirements Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// 3. GET REQUIREMENTS FEED (For Farmers - The "Marketplace")
exports.getRequirementsFeed = async (req, res) => {
  try {
    const { category, contractType } = req.query;

    // Default Filter: Active and Not Expired
    let query = {
      status: "active",
      // Ensure listing hasn't expired (if expiry date exists)
      $or: [
        { listingExpiresAt: { $exists: false } },
        { listingExpiresAt: { $gte: new Date() } },
      ],
    };

    if (category && category !== "all") {
      query.category = category;
    }

    if (contractType) {
      query.contractType = contractType;
    }

    const requirements = await BuyerRequirement.find(query)
      .populate("buyer", "companyName contactPerson profileImage address") // Show buyer details to farmer
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requirements.length,
      requirements,
    });
  } catch (error) {
    console.error("Feed Error:", error);
    res.status(500).json({ message: "Server Error fetching feed" });
  }
};

// 4. GET SINGLE REQUIREMENT DETAILS
exports.getRequirementById = async (req, res) => {
  try {
    const { id } = req.params;

    const requirement = await BuyerRequirement.findById(id).populate(
      "buyer",
      "companyName contactPerson email phone address"
    ); // Populate buyer info

    if (!requirement) {
      return res.status(404).json({ message: "Requirement not found" });
    }

    res.status(200).json({ requirement });
  } catch (error) {
    console.error("Get Single Req Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// 5. UPDATE REQUIREMENT
exports.updateRequirement = async (req, res) => {
  try {
    const { buyerId } = req.user;
    const { id } = req.params;

    // Prevent updating critical fields if offers already exist?
    // For now, allow simple updates.

    const requirement = await BuyerRequirement.findOneAndUpdate(
      { _id: id, buyer: buyerId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!requirement)
      return res
        .status(404)
        .json({ message: "Requirement not found or unauthorized" });

    res.status(200).json({ message: "Requirement updated", requirement });
  } catch (error) {
    console.error("Update Requirement Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// 6. DELETE REQUIREMENT
exports.deleteRequirement = async (req, res) => {
  try {
    const { buyerId } = req.user;
    const { id } = req.params;

    const requirement = await BuyerRequirement.findOneAndDelete({
      _id: id,
      buyer: buyerId,
    });

    if (!requirement)
      return res.status(404).json({ message: "Requirement not found" });

    res.status(200).json({ message: "Requirement deleted successfully" });
  } catch (error) {
    console.error("Delete Requirement Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

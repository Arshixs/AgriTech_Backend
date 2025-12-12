const BuyerRequirement = require('../models/BuyerRequirement');

// 1. POST A REQUIREMENT
exports.createRequirement = async (req, res) => {
  try {
    const { buyerId, role } = req.user;
    
    if (role !== 'buyer') {
      return res.status(403).json({ message: "Access denied. Only buyers can post requirements." });
    }

    const { title, description, category, quantity, unit, targetPrice } = req.body;

    const requirement = new BuyerRequirement({
      buyer: buyerId,
      title,
      description,
      category,
      quantity,
      unit,
      targetPrice
    });

    const savedRequirement = await requirement.save();
    res.status(201).json({ 
      message: "Requirement posted successfully", 
      requirement: savedRequirement 
    });

  } catch (error) {
    console.error("Create Requirement Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// 2. GET MY REQUIREMENTS
exports.getMyRequirements = async (req, res) => {
  try {
    const { buyerId } = req.user;
    const requirements = await BuyerRequirement.find({ buyer: buyerId }).sort({ createdAt: -1 });
    res.status(200).json({ count: requirements.length, requirements });
  } catch (error) {
    console.error("Get Requirements Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// 3. UPDATE REQUIREMENT
exports.updateRequirement = async (req, res) => {
  try {
    const { buyerId } = req.user;
    const { id } = req.params;

    const requirement = await BuyerRequirement.findOneAndUpdate(
      { _id: id, buyer: buyerId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!requirement) return res.status(404).json({ message: "Requirement not found" });

    res.status(200).json({ message: "Requirement updated", requirement });
  } catch (error) {
    console.error("Update Requirement Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// 4. DELETE REQUIREMENT
exports.deleteRequirement = async (req, res) => {
  try {
    const { buyerId } = req.user;
    const { id } = req.params;

    const requirement = await BuyerRequirement.findOneAndDelete({ _id: id, buyer: buyerId });

    if (!requirement) return res.status(404).json({ message: "Requirement not found" });

    res.status(200).json({ message: "Requirement deleted successfully" });
  } catch (error) {
    console.error("Delete Requirement Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
const Counter = require("../models/Counter");

const generateLotId = async () => {
  const counter = await Counter.findOneAndUpdate(
    { key: "QUALITY_LOT_ID" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  return `LOT-${counter.seq.toString().padStart(6, "0")}`;
};

module.exports = generateLotId;

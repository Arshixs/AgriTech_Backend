const express = require("express");
const router = express.Router();
const {
  placeBid,
  getBidsForSale,
  getMyBids,
} = require("../controllers/bidController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.post("/place", placeBid);
router.get("/my", getMyBids);
router.get("/:saleId", getBidsForSale);

module.exports = router;
const express = require("express");
const router = express.Router();
const {
  createOffer,
  getOffersForRequirement,
  getMyOffers,
  updateOfferStatus,
} = require("../controllers/requirementOfferController");
const { protect } = require("../middleware/authMiddleware");

// All routes require login
router.use(protect);

// Farmer Routes
router.post("/", createOffer); // POST /api/requirement-offers (Send Offer)
router.get("/my-offers", getMyOffers); // GET /api/requirement-offers/my-offers (View Sent Offers)

// Buyer Routes
router.get("/requirement/:requirementId", getOffersForRequirement); // GET /api/requirement-offers/requirement/:id
router.put("/:offerId/status", updateOfferStatus); // PUT /api/requirement-offers/:id/status (Accept/Reject)

module.exports = router;

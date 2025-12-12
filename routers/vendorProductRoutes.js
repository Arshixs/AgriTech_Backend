const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  addProduct,
  getMyProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getAllProducts,
} = require("../controllers/vendorProductController");

// All routes here require Vendor Login
router.use(protect);

// 1. Create & Read List
router.post("/", addProduct); // POST /api/vendor/product
router.get("/", getMyProducts); // GET  /api/vendor/product

// 3. Read all the product listed
router.get("/all", getAllProducts);

// 2. Read, Update, Delete Single Items
router.get("/:id", getProductById); // GET    /api/vendor/product/:id
router.put("/:id", updateProduct); // PUT    /api/vendor/product/:id
router.delete("/:id", deleteProduct); // DELETE /api/vendor/product/:id

module.exports = router;

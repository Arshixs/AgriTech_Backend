const VendorProduct = require("../models/VendorProduct");
const jwt = require("jsonwebtoken");

// --- 1. CREATE PRODUCT ---
exports.addProduct = async (req, res) => {
  try {
    const { name, description, price, stock, unit, category } = req.body;
    const { vendorId, role } = req.user;

    if (!role || role !== "vendor") {
      return res.status(401).json({ message: "Unauthorized" });
    }

    let product = new VendorProduct({
      vendor: vendorId,
      name,
      description,
      price,
      stock,
      unit,
      category,
    });

    const vendorProduct = await product.save();

    res
      .status(200)
      .json({ message: "Product successfully created", vendorProduct });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error updating profile" });
  }
};

// --- 2. GET ALL PRODUCTS (For Logged-in Vendor's Dashboard) ---
exports.getMyProducts = async (req, res) => {
  try {
    const { vendorId } = req.user;

    // Fetch all products belonging to this vendor, sorted by newest first
    const products = await VendorProduct.find({ vendor: vendorId }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Get My Products Error:", error);
    res.status(500).json({ message: "Server Error fetching products" });
  }
};

// --- 3. GET SINGLE PRODUCT ---
exports.getProductById = async (req, res) => {
  try {
    const product = await VendorProduct.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(product);
  } catch (error) {
    console.error("Get Product Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// --- 4. UPDATE PRODUCT ---
exports.updateProduct = async (req, res) => {
  try {
    const { vendorId } = req.user;
    const productId = req.params.id;

    // Security Check: Find product that matches ID AND belongs to this vendor
    let product = await VendorProduct.findOne({
      _id: productId,
      vendor: vendorId,
    });

    if (!product) {
      return res
        .status(404)
        .json({ message: "Product not found or unauthorized" });
    }

    // Update fields
    const { name, description, price, stock, unit, category } = req.body;

    // Using findByIdAndUpdate is cleaner for updates
    product = await VendorProduct.findByIdAndUpdate(
      productId,
      {
        name,
        description,
        price,
        stock,
        unit,
        category,
      },
      { new: true, runValidators: true } // Return the updated doc & validate data
    );

    res.status(200).json({
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error("Update Product Error:", error);
    res.status(500).json({ message: "Server Error updating product" });
  }
};

// --- 5. DELETE PRODUCT ---
exports.deleteProduct = async (req, res) => {
  try {
    const { vendorId } = req.user;
    const productId = req.params.id;

    const product = await VendorProduct.findOneAndDelete({
      _id: productId,
      vendor: vendorId, // Ensures vendor A cannot delete Vendor B's product
    });

    if (!product) {
      return res
        .status(404)
        .json({ message: "Product not found or unauthorized" });
    }

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete Product Error:", error);
    res.status(500).json({ message: "Server Error deleting product" });
  }
};

// --- 6. GET ALL PRODUCTS (Public - For Farmers/Buyers) ---
exports.getAllProducts = async (req, res) => {
  try {
    // Fetches all products from all vendors
    // .populate() gets the vendor's name and shop info to display to the farmer
    const products = await VendorProduct.find({})
      .populate("vendor", "organizationName name phone address")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Get All Products Error:", error);
    res.status(500).json({ message: "Server Error fetching products" });
  }
};

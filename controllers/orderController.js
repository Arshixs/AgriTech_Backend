const Order = require("../models/Order");
const VendorProduct = require("../models/VendorProduct");

// --- 1. BUYER: PLACE ORDER ---
exports.createOrder = async (req, res) => {
  try {
    const { buyerId } = req.user; // Authenticated Buyer
    const { productId, quantity, startDate, endDate, orderType } = req.body;

    // A. Fetch Product
    const product = await VendorProduct.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // B. Calculate Total Amount
    let totalAmount = 0;
    let rentalDetails = {};

    if (orderType === "purchase") {
      if (product.stock < quantity) {
        return res.status(400).json({ message: "Not enough stock available" });
      }
      totalAmount = product.price * quantity;
    } else if (orderType === "rental") {
      // Basic Rental Logic: Calculate difference in days
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include starting day

      if (diffDays <= 0)
        return res.status(400).json({ message: "Invalid dates" });

      totalAmount = product.price * diffDays;
      rentalDetails = {
        startDate: start,
        endDate: end,
        totalDays: diffDays,
      };
    }

    // C. Create Order
    const newOrder = new Order({
      buyer: buyerId,
      vendor: product.vendor, // Auto-link to the product's vendor
      product: productId,
      productSnapshot: {
        name: product.name,
        price: product.price,
        unit: product.unit,
      },
      orderType,
      quantity: orderType === "purchase" ? quantity : 1,
      rentalDuration: orderType === "rental" ? rentalDetails : undefined,
      totalAmount,
      status: "pending", // Vendor needs to accept
      paymentStatus: "cod", // Defaulting to COD for now
    });

    await newOrder.save();

    res.status(201).json({
      message: "Order placed successfully! Waiting for Vendor approval.",
      order: newOrder,
    });
  } catch (error) {
    console.error("Create Order Error:", error);
    res.status(500).json({ message: "Server Error placing order" });
  }
};

// --- 2. VENDOR: GET MY ORDERS (Incoming) ---
exports.getVendorOrders = async (req, res) => {
  try {
    const { vendorId } = req.user;

    // Fetch orders where this user is the Vendor
    // Populate shows Buyer name/details instead of just ID
    const orders = await Order.find({ vendor: vendorId })
      .populate("buyer", "contactPerson companyName phone")
      .sort({ createdAt: -1 });

    res.status(200).json({ orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// --- 3. BUYER: GET MY ORDERS (Outgoing) ---
exports.getBuyerOrders = async (req, res) => {
  try {
    const { buyerId } = req.user;

    // Populate shows Vendor details
    const orders = await Order.find({ buyer: buyerId })
      .populate("vendor", "organizationName name phone")
      .sort({ createdAt: -1 });

    res.status(200).json({ orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// --- 4. VENDOR: UPDATE ORDER STATUS (Accept/Reject/Complete) ---
exports.updateOrderStatus = async (req, res) => {
  try {
    const { vendorId } = req.user;
    const { orderId, status } = req.body; // status = 'accepted', 'rejected', 'completed'

    const order = await Order.findOne({ _id: orderId, vendor: vendorId });
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Logic: If accepting a PURCHASE, decrease stock
    if (
      status === "accepted" &&
      order.status === "pending" &&
      order.orderType === "purchase"
    ) {
      const product = await VendorProduct.findById(order.product);
      if (product) {
        if (product.stock < order.quantity) {
          return res
            .status(400)
            .json({ message: "Cannot accept: Stock too low" });
        }
        product.stock -= order.quantity;
        await product.save();
      }
    }

    // Update Status
    order.status = status;
    await order.save();

    res.status(200).json({ message: `Order marked as ${status}`, order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

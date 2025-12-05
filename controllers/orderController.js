const Order = require("../models/Order");
const VendorProduct = require("../models/VendorProduct");

// --- 1. BUYER: PLACE ORDER ---
exports.createOrder = async (req, res) => {
  try {
    const { buyerId } = req.user; // Authenticated Buyer
    const { productId, quantity = 1, startDate, endDate, orderType } = req.body; // Default quantity to 1

    // A. Fetch Product
    const product = await VendorProduct.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // B. Basic Stock Check (Sanity Check)
    // You cannot rent more items than physically exist in total
    if (product.stock < quantity) {
      return res.status(400).json({ message: `Only ${product.stock} units exist in total` });
    }

    // C. Calculate Total Amount & Specific Checks
    let totalAmount = 0;
    let rentalDetails = {};

    if (orderType === "purchase") {
      // For purchases, we permanently reduce stock later, but checking availability now is good
      if (product.stock < quantity) {
        return res.status(400).json({ message: `Not enough stock available` });
      }
      totalAmount = product.price * quantity;
    } 
    else if (orderType === "rental") {
      // 1. Parse Dates
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Calculate Duration
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 

      if (diffDays <= 0 || isNaN(diffDays)) {
        return res.status(400).json({ message: "Invalid rental dates" });
      }

      // --- CALENDAR AVAILABILITY CHECK ---
      // Find orders that overlap with our requested range
      // Status must be 'pending' or 'accepted' (rejected/cancelled don't block calendar)
      const conflictingOrders = await Order.find({
        product: productId,
        orderType: 'rental',
        status: { $in: ['accepted'] },
        'rentalDuration.startDate': { $lte: end },
        'rentalDuration.endDate': { $gte: start }
      });

      // Check day-by-day usage
      // We iterate from requested Start Date to End Date
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        let usedStockOnDay = 0;

        // Sum up quantity of all orders active on this specific day 'd'
        for (const order of conflictingOrders) {
          const oStart = new Date(order.rentalDuration.startDate);
          const oEnd = new Date(order.rentalDuration.endDate);

          if (d >= oStart && d <= oEnd) {
            usedStockOnDay += order.quantity;
          }
        }

        // Check if adding our request exceeds total stock
        if (usedStockOnDay + quantity > product.stock) {
          return res.status(400).json({ 
            message: `Not available on ${d.toDateString()}. Only ${product.stock - usedStockOnDay} units left for that date.` 
          });
        }
      }
      // -----------------------------------

      // 2. Calculate Total: Price * Days * Quantity
      totalAmount = product.price * diffDays * quantity;

      rentalDetails = {
        startDate: start,
        endDate: end,
        totalDays: diffDays
      };
    }

    // D. Create Order
    const newOrder = new Order({
      buyer: buyerId,
      vendor: product.vendor, 
      product: productId,
      productSnapshot: {
        name: product.name,
        price: product.price,
        unit: product.unit
      },
      orderType,
      quantity: quantity, 
      rentalDuration: orderType === "rental" ? rentalDetails : undefined,
      totalAmount,
      status: "pending", 
      paymentStatus: "cod" 
    });

    await newOrder.save();

    res.status(201).json({ 
      message: "Order placed successfully! Waiting for Vendor approval.", 
      order: newOrder 
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
    
    const orders = await Order.find({ vendor: vendorId })
      .populate("buyer", "contactPerson companyName phone") 
      .populate("product", "name") 
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
    
    const orders = await Order.find({ buyer: buyerId })
      .populate("vendor", "organizationName name phone")
      .populate("product", "name")
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
    const { orderId, status } = req.body; 

    const order = await Order.findOne({ _id: orderId, vendor: vendorId });
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Stock Logic for Purchases
    // Critical Note: Since 'pending' orders no longer block the calendar, it is possible for you to receive conflicting requests (e.g., two people asking for the last tractor on the same day). Be careful when accepting orders—once you accept one, you should manually reject the overlapping ones, or we can add a validation check to the "Accept" function in the future.
    if (status === "accepted" && order.status === "pending" && order.orderType === "purchase") {
      const product = await VendorProduct.findById(order.product);
      if (product) {
        if (product.stock < order.quantity) {
          return res.status(400).json({ message: "Cannot accept: Stock too low" });
        }
        product.stock -= order.quantity;
        await product.save();
      }
    }

    order.status = status;
    await order.save();

    res.status(200).json({ message: `Order marked as ${status}`, order });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};
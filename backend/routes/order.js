
const express = require("express");
const router = express.Router();

const Order = require("../models/order");
const authMiddleware = require("../middleware/authMiddleware");

// Food prices: backend verifies prices instead of trusting the browser.
const FOOD_CATALOG = {
  1: { name: "Margherita Pizza", price: 249 },
  2: { name: "Classic Cheeseburger", price: 199 },
  3: { name: "Crispy French Fries", price: 99 },
  4: { name: "Chicken Dum Biryani", price: 279 },
  5: { name: "Veg Hakka Noodles", price: 169 },
  6: { name: "Chocolate Brownie", price: 129 },
  7: { name: "Crispy Samosa", price: 49 },
  8: { name: "Farmhouse Pizza", price: 299 },
  9: { name: "Crispy Chicken Burger", price: 229 },
  10: { name: "Crispy Onion Rings", price: 119 },
  11: { name: "Paneer Biryani", price: 219 },
  12: { name: "Veg Spring Rolls", price: 149 },
  13: { name: "Strawberry Cheesecake", price: 179 },
  14: { name: "Mango Smoothie", price: 119 },
  15: { name: "Loaded Nachos", price: 189 },
  16: { name: "Veg Supreme Burger", price: 159 }
};

// CREATE ORDER
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { customerName, phone, address, items } = req.body;

    if (
      typeof customerName !== "string" ||
      customerName.trim().length < 2 ||
      customerName.trim().length > 60
    ) {
      return res.status(400).json({
        message: "Please enter a valid customer name."
      });
    }

    if (!/^[0-9]{10}$/.test(String(phone || ""))) {
      return res.status(400).json({
        message: "Enter a valid 10-digit mobile number."
      });
    }

    if (
      typeof address !== "string" ||
      address.trim().length < 10 ||
      address.trim().length > 500
    ) {
      return res.status(400).json({
        message: "Please enter a valid delivery address."
      });
    }

    if (!Array.isArray(items) || items.length === 0 || items.length > 16) {
      return res.status(400).json({
        message: "Your cart is empty or invalid."
      });
    }

    let totalAmount = 0;
    const verifiedItems = [];

    for (const item of items) {
      const foodId = Number(item.foodId);
      const quantity = Number(item.quantity);
      const food = FOOD_CATALOG[foodId];

      if (
        !food ||
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > 20
      ) {
        return res.status(400).json({
          message: "Invalid food item or quantity."
        });
      }

      const subtotal = food.price * quantity;
      totalAmount += subtotal;

      verifiedItems.push({
        foodId,
        name: food.name,
        price: food.price,
        quantity,
        subtotal
      });
    }

    const order = await Order.create({
      userId: req.userId,
      customerName: customerName.trim(),
      phone: String(phone),
      address: address.trim(),
      items: verifiedItems,
      totalAmount,
      paymentMethod: "COD"
    });

    return res.status(201).json({
      message: "Your order has been placed successfully!",
      order: {
        id: order._id,
        items: order.items,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        status: order.status,
        createdAt: order.createdAt
      }
    });

  } catch (error) {
    console.error("Order creation error:", error);

    return res.status(500).json({
      message: "Unable to place your order. Please try again."
    });
  }
});

// GET LOGGED-IN USER'S ORDERS
router.get("/my-orders", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({
      userId: req.userId
    }).sort({ createdAt: -1 });

    res.json({ orders });
  } catch (error) {
    console.error("Fetch orders error:", error);

    res.status(500).json({
      message: "Unable to fetch orders."
    });
  }
});

module.exports = router;
// Cancel Customer Order
router.patch("/:orderId/cancel", authMiddleware, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      userId: req.userId
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found."
      });
    }

    if (!["Pending", "Confirmed"].includes(order.status)) {
      return res.status(400).json({
        message: "This order can no longer be cancelled."
      });
    }

    order.status = "Cancelled";
    await order.save();

    res.json({
      message: "Order cancelled successfully.",
      order
    });

  } catch (error) {
    console.error("Cancel order error:", error);
    res.status(500).json({
      message: "Unable to cancel order."
    });
  }
});

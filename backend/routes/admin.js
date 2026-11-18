
const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

const Order = require("../models/order");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

// Allowed order statuses
const ALLOWED_STATUSES = [
  "Pending",
  "Confirmed",
  "Preparing",
  "Out for Delivery",
  "Delivered",
  "Cancelled"
];

// =====================================
// GET ALL CUSTOMER ORDERS
// =====================================

router.get(
  "/orders",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const orders = await Order.find()
        .sort({ createdAt: -1 })
        .lean();

      res.json({ orders });

    } catch (error) {
      console.error("Admin fetch orders error:", error);

      res.status(500).json({
        message: "Unable to fetch orders."
      });
    }
  }
);


// =====================================
// UPDATE ORDER STATUS
// =====================================

router.patch(
  "/orders/:orderId/status",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { orderId } = req.params;
      const { status } = req.body;

      if (!mongoose.isValidObjectId(orderId)) {
        return res.status(400).json({
          message: "Invalid order ID."
        });
      }

      if (!ALLOWED_STATUSES.includes(status)) {
        return res.status(400).json({
          message: "Invalid order status."
        });
      }

      const order = await Order.findByIdAndUpdate(
        orderId,
        { $set: { status } },
        {
          new: true,
          runValidators: true
        }
      );

      if (!order) {
        return res.status(404).json({
          message: "Order not found."
        });
      }

      res.json({
        message: "Order status updated successfully!",
        order
      });

    } catch (error) {
      console.error("Admin update status error:", error);

      res.status(500).json({
        message: "Unable to update order status."
      });
    }
  }
);

module.exports = router;

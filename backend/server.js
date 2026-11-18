
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET .env file mein set karo.");
}

app.use(cors({
  origin: "http://127.0.0.1:5500",
  credentials: true
}));

app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

// Home route
app.get("/", (req, res) => {
  res.json({
    message: "FoodieHub API is running!"
  });
});

// Authentication route
app.use("/api/auth", require("./routes/auth"));

// Order route
app.use("/api/orders", require("./routes/order"));

app.use("/api/admin", require("./routes/admin"));

// Start server
async function startServer() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI ||
      "mongodb://127.0.0.1:27017/foodiehub"
    );

    console.log("MongoDB connected successfully!");

    const port = process.env.PORT || 5000;

    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });

module.exports =app;

  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

startServer();

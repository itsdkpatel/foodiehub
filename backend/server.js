

require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable missing.");
}

// Frontend URLs
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://127.0.0.1:5500"
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
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

// MongoDB connection
let dbConnectionPromise;

async function connectDB(req, res, next) {
  try {
    const mongoURI =
      process.env.MONGODB_URI ||
      (process.env.VERCEL
        ? null
        : "mongodb://127.0.0.1:27017/foodiehub");

    if (!mongoURI) {
      return res.status(500).json({
        message: "MONGODB_URI is not configured."
      });
    }

    if (mongoose.connection.readyState === 1) {
      return next();
    }

    if (!dbConnectionPromise) {
      dbConnectionPromise = mongoose.connect(mongoURI).catch(error => {
        dbConnectionPromise = null;
        throw error;
      });
    }

    await dbConnectionPromise;
    next();

  } catch (error) {
    console.error("MongoDB connection error:", error.message);

    res.status(500).json({
      message: "Database connection failed."
    });
  }
}

// API routes
app.use("/api", connectDB);

app.use("/api/auth", require("./routes/auth"));
app.use("/api/orders", require("./routes/order"));
app.use("/api/admin", require("./routes/admin"));

// Export Express app for Vercel
module.exports = app;

// Local development only
if (require.main === module) {
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`Server running at http://127.0.0.1:${PORT}`);
  });
}

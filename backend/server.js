const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = 3004;

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("AI Procurement Backend is running 🚀");
});

// API: analyze project
app.post("/api/analyze-project", (req, res) => {
  try {
    const data = req.body;

    console.log("📦 Received data:", data);

    res.json({
      success: true,
      message: "Project analyzed successfully",
      dataReceived: data
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// 🧠 Temporary in-memory storage
const doubts = [];

// POST: Create a doubt
app.post("/api/doubts", (req, res) => {
  const { title, description, subject } = req.body;

  if (!title || !description || !subject) {
    return res.status(400).json({
      error: "All fields are required",
    });
  }

  const newDoubt = {
    id: Date.now(),
    title,
    description,
    subject,
  };

  doubts.push(newDoubt);

  console.log("Received doubt:", newDoubt);

  res.status(201).json({
    message: "Doubt added successfully",
    data: newDoubt,
  });
});

// GET: Fetch all doubts
app.get("/api/doubts", (req, res) => {
  res.status(200).json(doubts);
});

// Test route
app.get("/", (req, res) => {
  res.send("Backend is running");
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

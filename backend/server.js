const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

/* =========================
   FIREBASE ADMIN SETUP
========================= */
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    });
    console.log("✅ Firebase Admin Initialized");
  } catch (error) {
    console.error("❌ Firebase Initialization Error:", error);
  }
}

const db = admin.firestore();

/* =========================
   HEALTH CHECK
========================= */
app.get("/", (req, res) => {
  res.send("Backend connected to Firebase ✅ - Anonymous Doubt Portal Active");
});

/* =========================
   USERS & PROFILES
========================= */

// 1. Register a user (Student or Faculty)
app.post("/api/users", async (req, res) => {
  console.log("POST /api/users - Registering:", req.body);
  const { uid, name, role, subject } = req.body;

  if (!uid) return res.status(400).json({ error: "UID is required" });

  try {
    await db
      .collection("users")
      .doc(uid)
      .set({
        name,
        role,
        subject: subject || null,
      });
    res.json({ message: "User registered" });
  } catch (err) {
    res
      .status(500)
      .json({ error: "User creation failed", details: err.message });
  }
});

// 2. GET user profile (Used by Frontend to know Role/Subject automatically)
app.get("/api/users/:uid", async (req, res) => {
  console.log(`GET /api/users/${req.params.uid} - Fetching profile`);
  try {
    const doc = await db.collection("users").doc(req.params.uid).get();
    if (!doc.exists) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(doc.data());
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch user", details: err.message });
  }
});

/* =========================
   DOUBTS APIs
======================== */

app.post("/api/doubts", async (req, res) => {
  const { title, description, subject, createdBy } = req.body;
  try {
    const doubt = {
      title,
      description,
      subject,
      createdBy,
      createdAt: Date.now(),
      status: "open",
    };
    const docRef = await db.collection("doubts").add(doubt);
    res.status(201).json({ id: docRef.id, ...doubt });
  } catch (err) {
    res.status(500).json({ error: "Failed to create doubt" });
  }
});

app.get("/api/doubts/filter/:subject", async (req, res) => {
  const { subject } = req.params;
  try {
    const snapshot = await db
      .collection("doubts")
      .where("subject", "==", subject)
      .orderBy("createdAt", "desc")
      .get();

    const doubts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdBy: "Anonymous", // Identity hidden from Faculty
    }));
    res.json(doubts);
  } catch (err) {
    res.status(500).json({ error: "Filter failed", details: err.message });
  }
});

app.get("/api/admin/doubts", async (req, res) => {
  try {
    const snapshot = await db
      .collection("doubts")
      .orderBy("createdAt", "desc")
      .get();
    const doubts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(doubts);
  } catch (err) {
    res.status(500).json({ error: "Admin fetch failed" });
  }
});

/* =========================
   ANSWERS
========================= */

app.post("/api/answers", async (req, res) => {
  const { doubtId, answerText, answeredBy, role } = req.body;
  try {
    await db
      .collection("answers")
      .add({ doubtId, answerText, answeredBy, role, createdAt: Date.now() });
    res.status(201).json({ message: "Answer added" });
  } catch (err) {
    res.status(500).json({ error: "Failed to add answer" });
  }
});

app.get("/api/answers/:doubtId", async (req, res) => {
  try {
    const snapshot = await db
      .collection("answers")
      .where("doubtId", "==", req.params.doubtId)
      .get();
    const answers = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(answers);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch answers" });
  }
});

/* =========================
   SERVER START
========================= */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

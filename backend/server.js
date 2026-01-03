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
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});

const db = admin.firestore();

/* =========================
   TEST ROUTE
========================= */
app.get("/", (req, res) => {
  res.send("Backend connected to Firebase ✅");
});

/* =========================
   DOUBTS APIs (STUDENTS)
========================= */

// Create a doubt
app.post("/api/doubts", async (req, res) => {
  const { title, description, subject, createdBy } = req.body;

  if (!title || !description || !subject || !createdBy) {
    return res.status(400).json({ error: "All fields required" });
  }

  try {
    const doubt = {
      title,
      description,
      subject,
      createdBy,
      createdAt: Date.now(),
    };

    const docRef = await db.collection("doubts").add(doubt);
    res.status(201).json({ id: docRef.id, ...doubt });
  } catch (err) {
    res.status(500).json({ error: "Failed to create doubt" });
  }
});

// Get all doubts
app.get("/api/doubts", async (req, res) => {
  try {
    const snapshot = await db
      .collection("doubts")
      .orderBy("createdAt", "desc")
      .get();
    const doubts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.json(doubts);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch doubts" });
  }
});

/* =========================
   ANSWERS APIs (FACULTY / PEERS)
========================= */

// Add answer to a doubt
app.post("/api/answers", async (req, res) => {
  const { doubtId, answerText, answeredBy, role } = req.body;

  if (!doubtId || !answerText || !answeredBy || !role) {
    return res.status(400).json({ error: "All fields required" });
  }

  try {
    const answer = {
      doubtId,
      answerText,
      answeredBy,
      role, // student / faculty
      createdAt: Date.now(),
    };

    await db.collection("answers").add(answer);
    res.status(201).json({ message: "Answer added" });
  } catch (err) {
    res.status(500).json({ error: "Failed to add answer" });
  }
});

// Get answers for a doubt
app.get("/api/answers/:doubtId", async (req, res) => {
  const { doubtId } = req.params;

  try {
    const snapshot = await db
      .collection("answers")
      .where("doubtId", "==", doubtId)
      .get();

    const answers = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(answers);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch answers" });
  }
});

/* =========================
   USERS / ROLES (ADMIN)
========================= */

// Create user with role
app.post("/api/users", async (req, res) => {
  const { uid, name, role, subject } = req.body;

  if (!uid || !name || !role) {
    return res.status(400).json({ error: "Missing fields" });
  }

  await db
    .collection("users")
    .doc(uid)
    .set({
      name,
      role, // student / faculty / admin
      subject: subject || null,
    });

  res.json({ message: "User created" });
});

/* =========================
   SERVER START
========================= */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Doctor Appointment API is running" });
});

// Auth routes (Stage 2)
app.use("/api/auth", authRoutes);

// Further route mounts will be added here in later stages, e.g.:
// import doctorRoutes from "./routes/doctorRoutes.js";
// app.use("/api/doctors", doctorRoutes);

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

start();

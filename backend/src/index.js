import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

dotenv.config();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json());

// Health check — confirms the API is up before any real routes exist
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Doctor Appointment API is running" });
});

// Route mounts will be added here stage by stage, e.g.:
// import authRoutes from "./routes/authRoutes.js";
// app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

start();

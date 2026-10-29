import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import doctorRoutes from "./routes/doctorRoutes.js";
import availabilityRoutes from "./routes/availabilityRoutes.js";
import slotRoutes from "./routes/slotRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import queueRoutes from "./routes/queueRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import enquiryRoutes from "./routes/enquiryRoutes.js";
import rescheduleRoutes from "./routes/rescheduleRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import photoRoutes from "./routes/photoRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";
import { startScheduler } from "./utils/scheduler.js";

dotenv.config();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json({ limit: "1mb" })); // 1mb so doctor photos (small JPEGs) fit

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Doctor Appointment API is running" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/slots", slotRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/appointments", rescheduleRoutes);
app.use("/api/queue", queueRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/enquiries", enquiryRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/photos", photoRoutes);
app.use("/api/public", publicRoutes);

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  // Replace the old plain-unique slot index with the partial one (safe to run every start)
  try {
    const { default: Appointment } = await import("./models/Appointment.js");
    await Appointment.syncIndexes();
  } catch (err) {
    console.error("[indexes] could not sync appointment indexes:", err.message);
  }
  startScheduler();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

start();

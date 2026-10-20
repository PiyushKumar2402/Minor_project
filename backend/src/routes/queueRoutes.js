import express from "express";
import {
  checkIn,
  getQueueStatus,
  getTodayQueue,
  updateStatus,
  callNext,
} from "../controllers/queueController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// Patient
router.get("/appointment/:id", protect, authorizeRoles("patient"), getQueueStatus);
router.post("/appointment/:id/check-in", protect, authorizeRoles("patient"), checkIn);

// Doctor
router.get("/doctor/today", protect, authorizeRoles("doctor"), getTodayQueue);
router.post("/doctor/call-next", protect, authorizeRoles("doctor"), callNext);
router.put("/doctor/appointment/:id/status", protect, authorizeRoles("doctor"), updateStatus);

export default router;

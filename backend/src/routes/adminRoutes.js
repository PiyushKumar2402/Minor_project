import express from "express";
import { getStats, getAppointmentRows, downloadReport } from "../controllers/adminController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/stats", protect, authorizeRoles("admin"), getStats);
router.get("/appointments", protect, authorizeRoles("admin"), getAppointmentRows);

router.get("/report", protect, authorizeRoles("admin"), downloadReport);

export default router;

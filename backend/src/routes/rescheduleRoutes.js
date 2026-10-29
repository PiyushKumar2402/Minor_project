import express from "express";
import { rescheduleAppointment } from "../controllers/appointmentController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.put("/:id/reschedule", protect, authorizeRoles("patient"), rescheduleAppointment);

export default router;

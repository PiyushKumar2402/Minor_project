import express from "express";
import {
  bookAppointment,
  getMyAppointments,
  getDoctorAppointments,
  cancelAppointment,
} from "../controllers/appointmentController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, authorizeRoles("patient"), bookAppointment);
router.get("/me", protect, authorizeRoles("patient"), getMyAppointments);
router.get("/doctor/me", protect, authorizeRoles("doctor"), getDoctorAppointments);
router.put("/:id/cancel", protect, authorizeRoles("patient"), cancelAppointment);

export default router;

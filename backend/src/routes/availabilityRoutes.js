import express from "express";
import {
  getMyAvailability,
  updateMyAvailability,
  getAvailabilityByDoctorId,
} from "../controllers/availabilityController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// Doctor self-service (must come before the public "/:doctorId" route below,
// otherwise Express would treat "me" as a doctorId)
router.get("/me", protect, authorizeRoles("doctor"), getMyAvailability);
router.put("/me", protect, authorizeRoles("doctor"), updateMyAvailability);

// Public
router.get("/:doctorId", getAvailabilityByDoctorId);

export default router;

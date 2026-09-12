import express from "express";
import { getSlotsForDate } from "../controllers/slotController.js";

const router = express.Router();

// Public — patients need to see slots before logging in to decide who/when to book
router.get("/:doctorId", getSlotsForDate);

export default router;

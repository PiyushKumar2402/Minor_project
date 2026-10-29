import express from "express";
import { createReview, listReviews, myReviewedAppointments, deleteReview } from "../controllers/reviewController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", listReviews);
router.get("/mine", protect, authorizeRoles("patient"), myReviewedAppointments);
router.post("/", protect, authorizeRoles("patient"), createReview);
router.delete("/:id", protect, authorizeRoles("admin"), deleteReview);

export default router;

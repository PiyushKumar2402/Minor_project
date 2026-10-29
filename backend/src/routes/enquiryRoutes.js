import express from "express";
import { createEnquiry, listEnquiries } from "../controllers/enquiryController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", createEnquiry);
router.get("/", protect, authorizeRoles("admin"), listEnquiries);

export default router;

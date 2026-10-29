import express from "express";
import { getPhoto, uploadPhoto, deletePhoto } from "../controllers/photoController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:doctorId", getPhoto);
router.put("/:doctorId", protect, authorizeRoles("admin"), uploadPhoto);
router.delete("/:doctorId", protect, authorizeRoles("admin"), deletePhoto);

export default router;

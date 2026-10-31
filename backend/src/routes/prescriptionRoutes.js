import express from "express";
import { savePrescription, getPrescription, downloadPrescription, myPrescribedIds } from "../controllers/prescriptionController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/mine/ids", protect, authorizeRoles("patient", "doctor"), myPrescribedIds);
router.put("/:appointmentId", protect, authorizeRoles("doctor"), savePrescription);
router.get("/:appointmentId/pdf", protect, authorizeRoles("patient", "doctor"), downloadPrescription);
router.get("/:appointmentId", protect, authorizeRoles("patient", "doctor"), getPrescription);

export default router;

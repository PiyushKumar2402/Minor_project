import Prescription from "../models/Prescription.js";
import Appointment from "../models/Appointment.js";
import { writePrescriptionPdf } from "../utils/prescriptionPdf.js";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const str = (v, max) => String(v ?? "").trim().slice(0, max);

// Returns the appointment if this user is its doctor or its patient, otherwise sends the error.
async function loadAppointment(req, res, populate = false) {
  let q = Appointment.findById(req.params.appointmentId);
  if (populate) q = q.populate("doctor", "name specialization").populate("patient", "name phone");
  const appointment = await q;
  if (!appointment) { res.status(404).json({ message: "Appointment not found" }); return null; }
  const uid = String(req.user.id);
  const docId = String(appointment.doctor?._id || appointment.doctor);
  const patId = String(appointment.patient?._id || appointment.patient);
  const ok = (req.user.role === "doctor" && docId === uid) || (req.user.role === "patient" && patId === uid);
  if (!ok) { res.status(403).json({ message: "Not allowed" }); return null; }
  return appointment;
}

// @route PUT /api/prescriptions/:appointmentId  @access Private/Doctor (create or update)
export const savePrescription = async (req, res) => {
  try {
    const appointment = await loadAppointment(req, res);
    if (!appointment) return;
    if (req.user.role !== "doctor") return res.status(403).json({ message: "Only the doctor can write a prescription" });
    if (!["in-consultation", "completed"].includes(appointment.status)) {
      return res.status(400).json({ message: "A prescription can be written once the consultation has started." });
    }

    const diagnosis = str(req.body.diagnosis, 300);
    if (diagnosis.length < 2) return res.status(400).json({ message: "Please enter the diagnosis." });

    const rawMeds = Array.isArray(req.body.medicines) ? req.body.medicines : [];
    const medicines = rawMeds
      .map((m) => ({ name: str(m?.name, 100), dosage: str(m?.dosage, 60), frequency: str(m?.frequency, 60), duration: str(m?.duration, 60) }))
      .filter((m) => m.name);
    if (medicines.length === 0) return res.status(400).json({ message: "Add at least one medicine." });
    if (medicines.length > 15) return res.status(400).json({ message: "A prescription can have up to 15 medicines." });

    const advice = str(req.body.advice, 1000);
    const followUpDate = str(req.body.followUpDate, 10);
    if (followUpDate && !DATE_RE.test(followUpDate)) return res.status(400).json({ message: "Follow-up date is not valid." });

    const fields = { diagnosis, medicines, advice, followUpDate };
    const existing = await Prescription.findOne({ appointment: appointment._id });
    if (existing) {
      await Prescription.findOneAndUpdate({ _id: existing._id }, { $set: fields });
    } else {
      try {
        await Prescription.create({ appointment: appointment._id, doctor: appointment.doctor, patient: appointment.patient, ...fields });
      } catch (e) {
        if (e.code !== 11000) throw e;
        await Prescription.findOneAndUpdate({ appointment: appointment._id }, { $set: fields });
      }
    }
    res.json({ message: existing ? "Prescription updated" : "Prescription saved. The patient can now download it." });
  } catch (error) {
    res.status(500).json({ message: "Could not save the prescription" });
  }
};

// @route GET /api/prescriptions/:appointmentId  @access Private (doctor or patient of the visit)
export const getPrescription = async (req, res) => {
  try {
    const appointment = await loadAppointment(req, res);
    if (!appointment) return;
    const rx = await Prescription.findOne({ appointment: appointment._id });
    if (!rx) return res.status(404).json({ message: "No prescription yet" });
    res.json(rx);
  } catch (error) {
    res.status(500).json({ message: "Could not load the prescription" });
  }
};

// @route GET /api/prescriptions/:appointmentId/pdf  @access Private (doctor or patient of the visit)
export const downloadPrescription = async (req, res) => {
  try {
    const appointment = await loadAppointment(req, res, true);
    if (!appointment) return;
    const rx = await Prescription.findOne({ appointment: appointment._id });
    if (!rx) return res.status(404).json({ message: "No prescription yet" });
    res.set("Content-Type", "application/pdf");
    res.set("Content-Disposition", `attachment; filename="prescription-${appointment.date}.pdf"`);
    writePrescriptionPdf(res, {
      hospital: process.env.HOSPITAL_NAME || "ABC Hospital",
      doctor: appointment.doctor,
      patient: appointment.patient,
      appointment,
      rx,
    });
  } catch (error) {
    if (!res.headersSent) res.status(500).json({ message: "Could not create the PDF" });
  }
};

// @route GET /api/prescriptions/mine/ids  @access Private (appointment ids that have a prescription)
export const myPrescribedIds = async (req, res) => {
  try {
    const field = req.user.role === "doctor" ? "doctor" : "patient";
    const rows = await Prescription.find({ [field]: req.user.id }).select("appointment");
    res.json(rows.map((r) => String(r.appointment)));
  } catch (error) {
    res.status(500).json({ message: "Could not load prescriptions" });
  }
};

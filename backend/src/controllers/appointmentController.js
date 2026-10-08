import Appointment from "../models/Appointment.js";
import Slot from "../models/Slot.js";
import User from "../models/User.js";

// Generates the next queue number for a given doctor+date, e.g. "A01", "A02"...
const generateQueueNumber = async (doctorId, date) => {
  const count = await Appointment.countDocuments({
    doctor: doctorId,
    date,
    status: { $ne: "cancelled" },
  });
  return "A" + String(count + 1).padStart(2, "0");
};

// @route  POST /api/appointments
// @access Private/Patient
// Body: { doctorId, slotId }
export const bookAppointment = async (req, res) => {
  try {
    const { doctorId, slotId } = req.body;
    if (!doctorId || !slotId) {
      return res.status(400).json({ message: "doctorId and slotId are required" });
    }

    const doctor = await User.findOne({ _id: doctorId, role: "doctor" });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Atomic claim: only succeeds if the slot is still "available".
    // This is what actually prevents double-booking — if two patients click
    // the same slot at once, only one of these updates can match and win.
    const claimedSlot = await Slot.findOneAndUpdate(
      { _id: slotId, doctor: doctorId, status: "available" },
      { $set: { status: "booked" } },
      { new: true }
    );

    if (!claimedSlot) {
      return res.status(409).json({ message: "This slot was just booked by someone else. Please pick another." });
    }

    try {
      const queueNumber = await generateQueueNumber(doctorId, claimedSlot.date);

      const appointment = await Appointment.create({
        patient: req.user.id,
        doctor: doctorId,
        slot: claimedSlot._id,
        date: claimedSlot.date,
        startTime: claimedSlot.startTime,
        endTime: claimedSlot.endTime,
        queueNumber,
      });

      res.status(201).json(appointment);
    } catch (creationError) {
      // If appointment creation fails after the slot was claimed, release the
      // slot back to available so it isn't stuck as permanently booked.
      await Slot.findByIdAndUpdate(claimedSlot._id, { $set: { status: "available" } });
      throw creationError;
    }
  } catch (error) {
    res.status(500).json({ message: "Could not book appointment", error: error.message });
  }
};

// @route  GET /api/appointments/me
// @access Private/Patient
export const getMyAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patient: req.user.id })
      .populate("doctor", "name specialization")
      .sort({ date: -1, startTime: -1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: "Could not fetch appointments", error: error.message });
  }
};

// @route  GET /api/appointments/doctor/me
// @access Private/Doctor
// Lets a doctor see their own appointments (foundation for Stage 9's dashboard)
export const getDoctorAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctor: req.user.id })
      .populate("patient", "name phone")
      .sort({ date: 1, startTime: 1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: "Could not fetch appointments", error: error.message });
  }
};

// @route  PUT /api/appointments/:id/cancel
// @access Private/Patient (must own the appointment)
export const cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (appointment.patient.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only cancel your own appointments" });
    }

    if (appointment.status === "cancelled") {
      return res.status(400).json({ message: "This appointment is already cancelled" });
    }

    appointment.status = "cancelled";
    await appointment.save();

    // Free the slot back up for other patients to book
    await Slot.findByIdAndUpdate(appointment.slot, { $set: { status: "available" } });

    res.json({ message: "Appointment cancelled", appointment });
  } catch (error) {
    res.status(500).json({ message: "Could not cancel appointment", error: error.message });
  }
};

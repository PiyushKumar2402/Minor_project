import Appointment from "../models/Appointment.js";
import Slot from "../models/Slot.js";
import User from "../models/User.js";
import { createZoomMeeting } from "../utils/zoom.js";
import { timeToMinutes } from "../utils/slotGenerator.js";
import { sendEmail } from "../utils/mailer.js";
import { buildBookingEmail, buildCancellationEmail } from "../utils/emailTemplates.js";

const VALID_MODES = ["online", "in-person"];

// A patient may hold only ONE of these on any given day (with any doctor).
// Cancelled and no-show appointments don't count, so cancelling frees the day.
const ACTIVE_STATUSES = ["booked", "waiting", "in-consultation"];

// Queue number = the slot's position in that doctor's day (A01 = first slot, A02 = second...).
// Because the slot itself is unique per booking, two patients can never get the same number,
// and the numbers always follow appointment-time order, which is the order the queue is served in.
// (Numbers can skip when a slot is unbooked, e.g. A01, A03, A04. That is expected.)
const queueNumberForSlot = async (slot) => {
  const position = await Slot.countDocuments({
    doctor: slot.doctor,
    date: slot.date,
    startTime: { $lte: slot.startTime }, // "HH:MM" is zero-padded, so string comparison is time order
  });
  return "A" + String(position).padStart(2, "0");
};

// Sends an email in the background. sendEmail() never throws, so this can never
// break the request that triggered it, and the patient doesn't wait for Gmail.
const sendInBackground = (message) => {
  sendEmail(message).catch((err) => console.error("[email] unexpected error:", err.message));
};

// @route  POST /api/appointments
// @access Private/Patient
// Body: { doctorId, slotId, mode }  — mode is "online" or "in-person"
export const bookAppointment = async (req, res) => {
  try {
    const { doctorId, slotId } = req.body;
    const mode = req.body.mode || "in-person";

    if (!doctorId || !slotId) {
      return res.status(400).json({ message: "doctorId and slotId are required" });
    }
    if (!VALID_MODES.includes(mode)) {
      return res.status(400).json({ message: "mode must be either 'online' or 'in-person'" });
    }

    const doctor = await User.findOne({ _id: doctorId, role: "doctor" });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // One appointment per patient per day. Checked BEFORE the slot is claimed,
    // so a refused request never touches the slot.
    const wantedSlot = await Slot.findOne({ _id: slotId, doctor: doctorId });
    if (!wantedSlot) {
      return res.status(404).json({ message: "That time slot doesn't exist." });
    }
    const sameDay = await Appointment.findOne({
      patient: req.user.id,
      date: wantedSlot.date,
      status: { $in: ACTIVE_STATUSES },
    }).populate("doctor", "name");
    if (sameDay) {
      const withDoctor = sameDay.doctor?.name ? ` with Dr. ${sameDay.doctor.name}` : "";
      return res.status(409).json({
        message: `You already have an appointment on ${wantedSlot.date}${withDoctor} at ${sameDay.startTime}. Only one appointment per day can be booked. Cancel it first if you want a different time.`,
      });
    }

    // Atomic claim — only succeeds if the slot is still available (prevents double-booking)
    const claimedSlot = await Slot.findOneAndUpdate(
      { _id: slotId, doctor: doctorId, status: "available" },
      { $set: { status: "booked" } },
      { new: true }
    );

    if (!claimedSlot) {
      return res.status(409).json({ message: "This slot was just booked by someone else. Please pick another." });
    }

    let appointment;
    try {
      const queueNumber = await queueNumberForSlot(claimedSlot);

      const details = {
        patient: req.user.id,
        doctor: doctorId,
        slot: claimedSlot._id,
        date: claimedSlot.date,
        startTime: claimedSlot.startTime,
        endTime: claimedSlot.endTime,
        queueNumber,
        mode,
      };

      if (mode === "in-person") {
        details.room = doctor.roomNumber || "";
      } else {
        const durationMinutes = timeToMinutes(claimedSlot.endTime) - timeToMinutes(claimedSlot.startTime);
        const meeting = await createZoomMeeting({
          topic: `Consultation with Dr. ${doctor.name}`,
          date: claimedSlot.date,
          startTime: claimedSlot.startTime,
          durationMinutes,
        });
        details.meetingId = meeting.meetingId;
        details.meetingJoinUrl = meeting.joinUrl;
        details.meetingStartUrl = meeting.startUrl;
        details.meetingPassword = meeting.password;
        details.meetingIsDemo = meeting.isDemo;
      }

      appointment = await Appointment.create(details);
    } catch (creationError) {
      // Anything failed after the slot was claimed (e.g. Zoom is down): free the slot again
      await Slot.findByIdAndUpdate(claimedSlot._id, { $set: { status: "available" } });
      throw creationError;
    }

    // Confirmation email. Booking is already saved — email problems can't undo it.
    const patient = await User.findById(req.user.id).select("name email");
    if (patient) {
      sendInBackground(buildBookingEmail({ appointment, doctor, patient }));
    }

    // The host (start) link is for the doctor only — never send it to the patient
    const response = appointment.toObject();
    delete response.meetingStartUrl;
    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({ message: `Could not book appointment: ${error.message}` });
  }
};

// @route  GET /api/appointments/me
// @access Private/Patient
export const getMyAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patient: req.user.id })
      .select("-meetingStartUrl")
      .populate("doctor", "name specialization")
      .sort({ date: -1, startTime: -1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: "Could not fetch appointments", error: error.message });
  }
};

// @route  GET /api/appointments/doctor/me
// @access Private/Doctor
// Includes the Zoom host link so the doctor can start the same meeting
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
// Only possible while the appointment is still "booked". Once the patient has
// checked in (or been seen / marked no-show) it is part of the live queue.
export const cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (appointment.patient.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: "You can only cancel your own appointments" });
    }

    if (appointment.status === "cancelled") {
      return res.status(400).json({ message: "This appointment is already cancelled" });
    }

    // Atomic: cancels only if it is still "booked", so it can't race with a check-in
    const cancelled = await Appointment.findOneAndUpdate(
      { _id: appointment._id, status: "booked" },
      { $set: { status: "cancelled" } },
      { new: true }
    );

    if (!cancelled) {
      return res.status(400).json({
        message: `This appointment can no longer be cancelled because it is already ${appointment.status}.`,
      });
    }

    await Slot.findByIdAndUpdate(cancelled.slot, { $set: { status: "available" } });

    // Cancellation email
    const [doctor, patient] = await Promise.all([
      User.findById(cancelled.doctor).select("name"),
      User.findById(cancelled.patient).select("name email"),
    ]);
    if (doctor && patient) {
      sendInBackground(buildCancellationEmail({ appointment: cancelled, doctor, patient }));
    }

    // Don't hand the Zoom host link back to the patient
    const response = cancelled.toObject();
    delete response.meetingStartUrl;
    res.json({ message: "Appointment cancelled", appointment: response });
  } catch (error) {
    res.status(500).json({ message: "Could not cancel appointment", error: error.message });
  }
};

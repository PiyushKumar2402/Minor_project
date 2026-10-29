import Appointment from "../models/Appointment.js";
import Slot from "../models/Slot.js";
import User from "../models/User.js";
import { createZoomMeeting } from "../utils/zoom.js";
import { todayInClinic, nowTimeInClinic } from "../utils/clinicDate.js";
import { timeToMinutes } from "../utils/slotGenerator.js";
import { sendEmail } from "../utils/mailer.js";
import { buildBookingEmail, buildCancellationEmail, formatDate, formatTime } from "../utils/emailTemplates.js";
import { buildDoctorNewAppointmentEmail, buildDoctorCancellationEmail, buildDoctorRescheduleEmail } from "../utils/doctorEmails.js";

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
    const reason = String(req.body.reason || "").trim().slice(0, 500);

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
    // Can't book a time that has already passed (clinic's own date and clock)
    const clinicToday = todayInClinic();
    if (wantedSlot.date < clinicToday || (wantedSlot.date === clinicToday && wantedSlot.startTime < nowTimeInClinic())) {
      return res.status(400).json({ message: "That time has already passed. Please pick a later slot." });
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
        reason,
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
    const patient = await User.findById(req.user.id).select("name email phone");
    if (patient) {
      sendInBackground(buildBookingEmail({ appointment, doctor, patient }));
      // ...and tell the doctor
      sendInBackground(buildDoctorNewAppointmentEmail({ appointment, doctor, patient }));
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
      User.findById(cancelled.doctor).select("name email"),
      User.findById(cancelled.patient).select("name email phone"),
    ]);
    if (doctor && patient) {
      sendInBackground(buildCancellationEmail({ appointment: cancelled, doctor, patient }));
      sendInBackground(buildDoctorCancellationEmail({ appointment: cancelled, doctor, patient }));
    }

    // Don't hand the Zoom host link back to the patient
    const response = cancelled.toObject();
    delete response.meetingStartUrl;
    res.json({ message: "Appointment cancelled", appointment: response });
  } catch (error) {
    res.status(500).json({ message: "Could not cancel appointment", error: error.message });
  }
};

// @route  PUT /api/appointments/:id/reschedule
// @access Private/Patient (must own the appointment)
// Body: { slotId } - a different slot with the SAME doctor.
// Only while the appointment is still "booked". Keeps the visit mode (online gets a new Zoom meeting).
export const rescheduleAppointment = async (req, res) => {
  try {
    const { slotId } = req.body;
    if (!slotId) return res.status(400).json({ message: "slotId is required" });

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });
    if (appointment.patient.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: "You can only reschedule your own appointments" });
    }
    if (appointment.status !== "booked") {
      return res.status(400).json({
        message: `Only appointments that are still "booked" can be rescheduled (this one is ${appointment.status}).`,
      });
    }
    if (appointment.slot.toString() === String(slotId)) {
      return res.status(400).json({ message: "That is already your current time slot." });
    }

    const before = { date: appointment.date, startTime: appointment.startTime }; // old time, for the doctor's email
    const newSlot = await Slot.findOne({ _id: slotId, doctor: appointment.doctor });
    if (!newSlot) return res.status(404).json({ message: "That time slot doesn't exist for this doctor." });

    const clinicToday = todayInClinic();
    if (newSlot.date < clinicToday || (newSlot.date === clinicToday && newSlot.startTime < nowTimeInClinic())) {
      return res.status(400).json({ message: "That time has already passed. Please pick a later slot." });
    }

    // One appointment per day: the appointment being moved doesn't count against itself
    const sameDay = (
      await Appointment.find({ patient: req.user.id, date: newSlot.date, status: { $in: ACTIVE_STATUSES } })
    ).find((a) => a._id.toString() !== appointment._id.toString());
    if (sameDay) {
      return res.status(409).json({
        message: `You already have another appointment on ${newSlot.date} at ${sameDay.startTime}. Only one appointment per day can be booked.`,
      });
    }

    // Atomic claim of the new slot
    const claimed = await Slot.findOneAndUpdate(
      { _id: slotId, doctor: appointment.doctor, status: "available" },
      { $set: { status: "booked" } },
      { new: true }
    );
    if (!claimed) {
      return res.status(409).json({ message: "This slot was just booked by someone else. Please pick another." });
    }

    const oldSlotId = appointment.slot;
    let updated;
    try {
      const doctor = await User.findById(appointment.doctor).select("name email roomNumber specialization");
      const changes = {
        slot: claimed._id,
        date: claimed.date,
        startTime: claimed.startTime,
        endTime: claimed.endTime,
        queueNumber: await queueNumberForSlot(claimed),
        reminderSentAt: null,
      };
      if (appointment.mode === "online") {
        const meeting = await createZoomMeeting({
          topic: `Consultation with Dr. ${doctor?.name}`,
          date: claimed.date,
          startTime: claimed.startTime,
          durationMinutes: timeToMinutes(claimed.endTime) - timeToMinutes(claimed.startTime),
        });
        changes.meetingId = meeting.meetingId;
        changes.meetingJoinUrl = meeting.joinUrl;
        changes.meetingStartUrl = meeting.startUrl;
        changes.meetingPassword = meeting.password;
        changes.meetingIsDemo = meeting.isDemo;
      }

      // Only succeeds if it is still "booked" on the same slot (can't race with a check-in or cancel)
      updated = await Appointment.findOneAndUpdate(
        { _id: appointment._id, status: "booked", slot: oldSlotId },
        { $set: changes },
        { new: true }
      );
      if (!updated) {
        await Slot.findByIdAndUpdate(claimed._id, { $set: { status: "available" } });
        return res.status(409).json({ message: "This appointment changed while you were rescheduling. Please refresh and try again." });
      }

      const patient = await User.findById(req.user.id).select("name email phone");
      if (patient && doctor) {
        const mail = buildBookingEmail({ appointment: updated, doctor, patient });
        sendInBackground({ ...mail, subject: `Appointment Rescheduled - ${formatDate(updated.date)}, ${formatTime(updated.startTime)}` });
        sendInBackground(buildDoctorRescheduleEmail({ appointment: updated, doctor, patient, before }));
      }
    } catch (err) {
      await Slot.findByIdAndUpdate(claimed._id, { $set: { status: "available" } });
      throw err;
    }

    // Release the old slot only after the move has succeeded
    await Slot.findByIdAndUpdate(oldSlotId, { $set: { status: "available" } });

    const response = updated.toObject();
    delete response.meetingStartUrl;
    res.json({ message: "Appointment rescheduled", appointment: response });
  } catch (error) {
    res.status(500).json({ message: `Could not reschedule: ${error.message}` });
  }
};

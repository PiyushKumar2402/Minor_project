import Appointment from "../models/Appointment.js";
import { todayInClinic } from "../utils/clinicDate.js";

// Which current statuses a doctor may move an appointment FROM, for each target status.
//   booked -> waiting            (patient arrived; doctor/front desk checks them in)
//   waiting -> in-consultation   (doctor calls the patient in)
//   in-consultation -> completed
//   booked | waiting -> no-show
export const ALLOWED_FROM = {
  waiting: ["booked"],
  "in-consultation": ["waiting"],
  completed: ["in-consultation"],
  "no-show": ["booked", "waiting"],
};

// Which timestamp field to stamp when entering a status
const TIMESTAMP_FIELD = {
  waiting: "checkedInAt",
  "in-consultation": "consultationStartedAt",
  completed: "completedAt",
};

const stampFor = (status) => (TIMESTAMP_FIELD[status] ? { [TIMESTAMP_FIELD[status]]: new Date() } : {});

// ---------------------------------------------------------------------------
// PATIENT SIDE
// ---------------------------------------------------------------------------

// @route  POST /api/queue/appointment/:id/check-in
// @access Private/Patient (must own the appointment)
// "I've arrived" — moves booked -> waiting, only on the day of the appointment.
export const checkIn = async (req, res) => {
  try {
    const today = todayInClinic();

    const updated = await Appointment.findOneAndUpdate(
      { _id: req.params.id, patient: req.user.id, status: "booked", date: today },
      { $set: { status: "waiting", ...stampFor("waiting") } },
      { new: true }
    );

    if (updated) {
      return res.json({ message: "You're checked in. Please wait for your turn.", appointment: updated });
    }

    // Work out why, so the patient gets a useful message
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment || appointment.patient.toString() !== req.user.id.toString()) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    if (appointment.date !== today) {
      return res.status(400).json({ message: "You can only check in on the day of your appointment." });
    }
    return res.status(400).json({ message: `Cannot check in: this appointment is already ${appointment.status}.` });
  } catch (error) {
    res.status(500).json({ message: "Could not check in", error: error.message });
  }
};

// @route  GET /api/queue/appointment/:id
// @access Private/Patient (must own the appointment)
// Live view: your queue number, who is being served, how many are ahead of you.
export const getQueueStatus = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id).populate("doctor", "name specialization");
    if (!appointment || appointment.patient.toString() !== req.user.id.toString()) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const today = todayInClinic();
    const isToday = appointment.date === today;

    const base = {
      appointmentId: appointment._id,
      doctor: appointment.doctor,
      date: appointment.date,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      mode: appointment.mode,
      queueNumber: appointment.queueNumber,
      status: appointment.status,
      isToday,
    };

    // The live queue only exists for active appointments happening today
    const isActive = ["booked", "waiting", "in-consultation"].includes(appointment.status);
    if (!isToday || !isActive) {
      return res.json({ ...base, nowServing: null, patientsAhead: 0 });
    }

    const beingServed = await Appointment.findOne({
      doctor: appointment.doctor._id,
      date: appointment.date,
      status: "in-consultation",
    }).select("queueNumber");

    // Checked-in patients with an earlier slot are served before you
    const waitingAhead = await Appointment.countDocuments({
      doctor: appointment.doctor._id,
      date: appointment.date,
      status: "waiting",
      startTime: { $lt: appointment.startTime },
    });

    // Whoever is in with the doctor right now is also ahead of you (unless that is you)
    const someoneElseInside = beingServed && beingServed._id.toString() !== appointment._id.toString();

    res.json({
      ...base,
      nowServing: beingServed ? beingServed.queueNumber : null,
      patientsAhead: waitingAhead + (someoneElseInside ? 1 : 0),
    });
  } catch (error) {
    res.status(500).json({ message: "Could not fetch queue status", error: error.message });
  }
};

// ---------------------------------------------------------------------------
// DOCTOR SIDE
// ---------------------------------------------------------------------------

// @route  GET /api/queue/doctor/today
// @access Private/Doctor
export const getTodayQueue = async (req, res) => {
  try {
    const today = todayInClinic();

    const appointments = await Appointment.find({
      doctor: req.user.id,
      date: today,
      status: { $ne: "cancelled" },
    })
      .populate("patient", "name phone")
      .sort({ startTime: 1 });

    const nowServing = appointments.find((a) => a.status === "in-consultation") || null;

    const counts = { booked: 0, waiting: 0, "in-consultation": 0, completed: 0, "no-show": 0 };
    appointments.forEach((a) => {
      if (counts[a.status] !== undefined) counts[a.status] += 1;
    });

    res.json({ date: today, nowServing, counts, appointments });
  } catch (error) {
    res.status(500).json({ message: "Could not fetch today's queue", error: error.message });
  }
};

// @route  PUT /api/queue/doctor/appointment/:id/status
// @access Private/Doctor (must be their own appointment)
// Body: { status: "waiting" | "in-consultation" | "completed" | "no-show" }
export const updateStatus = async (req, res) => {
  try {
    const target = req.body.status;
    const allowedFrom = ALLOWED_FROM[target];
    if (!allowedFrom) {
      return res.status(400).json({
        message: `status must be one of: ${Object.keys(ALLOWED_FROM).join(", ")}`,
      });
    }

    const appointment = await Appointment.findOne({ _id: req.params.id, doctor: req.user.id });
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const today = todayInClinic();
    if (appointment.date !== today) {
      return res.status(400).json({ message: "Only today's appointments can be updated from the queue." });
    }

    // One patient inside at a time
    if (target === "in-consultation") {
      const alreadyInside = await Appointment.findOne({
        doctor: req.user.id,
        date: today,
        status: "in-consultation",
      }).select("queueNumber");
      if (alreadyInside) {
        return res.status(409).json({
          message: `Finish the current consultation (${alreadyInside.queueNumber}) before starting the next one.`,
        });
      }
    }

    // Atomic: only moves if it is still in an allowed "from" status, so a double-click
    // or two open tabs can't push an appointment through the flow twice.
    const updated = await Appointment.findOneAndUpdate(
      { _id: appointment._id, doctor: req.user.id, status: { $in: allowedFrom } },
      { $set: { status: target, ...stampFor(target) } },
      { new: true }
    ).populate("patient", "name phone");

    if (!updated) {
      const current = await Appointment.findById(appointment._id).select("status");
      return res.status(409).json({
        message: `Cannot move an appointment from "${current?.status}" to "${target}".`,
      });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Could not update appointment status", error: error.message });
  }
};

// @route  POST /api/queue/doctor/call-next
// @access Private/Doctor
// Calls in the checked-in patient with the earliest slot time.
export const callNext = async (req, res) => {
  try {
    const today = todayInClinic();

    const alreadyInside = await Appointment.findOne({
      doctor: req.user.id,
      date: today,
      status: "in-consultation",
    }).select("queueNumber");
    if (alreadyInside) {
      return res.status(409).json({
        message: `Finish the current consultation (${alreadyInside.queueNumber}) before calling the next patient.`,
      });
    }

    const next = await Appointment.findOneAndUpdate(
      { doctor: req.user.id, date: today, status: "waiting" },
      { $set: { status: "in-consultation", ...stampFor("in-consultation") } },
      { new: true, sort: { startTime: 1 } }
    ).populate("patient", "name phone");

    if (!next) {
      return res.status(404).json({ message: "No patients are waiting right now." });
    }

    res.json(next);
  } catch (error) {
    res.status(500).json({ message: "Could not call the next patient", error: error.message });
  }
};

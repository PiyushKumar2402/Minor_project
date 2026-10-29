import mongoose from "mongoose";

// Queue status flow (Stage 8):
//   booked -> waiting -> in-consultation -> completed
//   booked | waiting -> no-show
//   booked -> cancelled (patient cancels before arriving)
export const APPOINTMENT_STATUSES = [
  "booked",
  "waiting",
  "in-consultation",
  "completed",
  "no-show",
  "cancelled",
];

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    slot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Slot",
      required: true,
    },
    date: { type: String, required: true }, // "YYYY-MM-DD"
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    queueNumber: { type: String, required: true },

    // ----- Consultation mode (Stage 6) -----
    mode: {
      type: String,
      enum: ["online", "in-person"],
      default: "in-person",
    },
    room: { type: String, default: "" },
    reason: { type: String, default: "", maxlength: 500 }, // reason for visit, given by the patient
    meetingId: { type: String, default: "" },
    meetingJoinUrl: { type: String, default: "" },
    meetingStartUrl: { type: String, default: "" }, // host link, doctor only
    meetingPassword: { type: String, default: "" },
    meetingIsDemo: { type: Boolean, default: false },

    // ----- Queue (Stage 8) -----
    status: {
      type: String,
      enum: APPOINTMENT_STATUSES,
      default: "booked",
    },
    checkedInAt: { type: Date, default: null },
    consultationStartedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },

    // ----- Reminders (Stage 11) -----
    reminderSentAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Speeds up the queue lookups (one doctor, one day, by status)
appointmentSchema.index({ doctor: 1, date: 1, status: 1 });

// One appointment per slot, but ONLY among appointments that still hold the slot.
// A cancelled appointment keeps its slot id for history, and the slot can then be
// booked again by someone else, so cancelled ones must not count.
appointmentSchema.index(
  { slot: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ["booked", "waiting", "in-consultation", "completed", "no-show"] } },
  }
);

const Appointment = mongoose.model("Appointment", appointmentSchema);

export default Appointment;

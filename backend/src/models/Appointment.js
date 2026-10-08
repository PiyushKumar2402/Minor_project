import mongoose from "mongoose";

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
      unique: true,
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
    // In-person details
    room: { type: String, default: "" },
    // Online details (Zoom)
    meetingId: { type: String, default: "" },
    meetingJoinUrl: { type: String, default: "" }, // for the patient
    meetingStartUrl: { type: String, default: "" }, // host link, for the doctor only
    meetingPassword: { type: String, default: "" },
    meetingIsDemo: { type: Boolean, default: false },

    status: {
      type: String,
      enum: ["booked", "cancelled", "completed"],
      default: "booked",
    },
  },
  { timestamps: true }
);

const Appointment = mongoose.model("Appointment", appointmentSchema);

export default Appointment;

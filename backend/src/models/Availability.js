import mongoose from "mongoose";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const daySchema = new mongoose.Schema(
  {
    day: { type: String, enum: DAYS, required: true },
    isOff: { type: Boolean, default: true },
    startTime: { type: String, default: "10:00" }, // "HH:MM", 24-hour
    endTime: { type: String, default: "14:00" },
  },
  { _id: false }
);

const availabilitySchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    slotDurationMinutes: {
      type: Number,
      default: 15,
      min: 5,
    },
    schedule: {
      type: [daySchema],
      default: () => DAYS.map((day) => ({ day, isOff: true })),
    },
  },
  { timestamps: true }
);

const Availability = mongoose.model("Availability", availabilitySchema);

export default Availability;
export { DAYS };

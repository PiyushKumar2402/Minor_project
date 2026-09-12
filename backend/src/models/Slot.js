import mongoose from "mongoose";

const slotSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      // Stored as "YYYY-MM-DD" for simple, unambiguous matching
      type: String,
      required: true,
    },
    startTime: {
      type: String, // "HH:MM"
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["available", "booked"],
      default: "available",
    },
  },
  { timestamps: true }
);

// A doctor can't have two identical slots on the same date
slotSchema.index({ doctor: 1, date: 1, startTime: 1 }, { unique: true });

const Slot = mongoose.model("Slot", slotSchema);

export default Slot;

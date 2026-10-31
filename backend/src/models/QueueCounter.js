import mongoose from "mongoose";

// One counter per doctor per day. Atomically increased for every new booking,
// so queue numbers follow booking order and can never repeat.
const queueCounterSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true }, // "<doctorId>:<YYYY-MM-DD>"
  seq: { type: Number, default: 0 },
});

export default mongoose.model("QueueCounter", queueCounterSchema);

import mongoose from "mongoose";

const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    dosage: { type: String, default: "", trim: true, maxlength: 60 },
    frequency: { type: String, default: "", trim: true, maxlength: 60 },
    duration: { type: String, default: "", trim: true, maxlength: 60 },
  },
  { _id: false }
);

const prescriptionSchema = new mongoose.Schema(
  {
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: true, unique: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    diagnosis: { type: String, required: true, trim: true, maxlength: 300 },
    medicines: { type: [medicineSchema], default: [] },
    advice: { type: String, default: "", trim: true, maxlength: 1000 },
    followUpDate: { type: String, default: "" }, // "YYYY-MM-DD" or empty
  },
  { timestamps: true }
);

prescriptionSchema.index({ patient: 1 });

export default mongoose.model("Prescription", prescriptionSchema);

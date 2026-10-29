import mongoose from "mongoose";

// Doctor profile photos, kept in the database (small JPEGs) so no file storage is needed.
const doctorPhotoSchema = new mongoose.Schema(
  {
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    contentType: { type: String, required: true },
    data: { type: Buffer, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("DoctorPhoto", doctorPhotoSchema);

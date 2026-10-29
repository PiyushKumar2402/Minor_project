import DoctorPhoto from "../models/DoctorPhoto.js";
import User from "../models/User.js";

const MAX_BYTES = 300 * 1024;

// @route  GET /api/photos/:doctorId   @access Public (an image, or 404)
export const getPhoto = async (req, res) => {
  try {
    const photo = await DoctorPhoto.findOne({ doctor: req.params.doctorId });
    if (!photo) return res.status(404).end();
    res.set("Content-Type", photo.contentType);
    res.set("Cache-Control", "public, max-age=300");
    res.send(photo.data);
  } catch (error) {
    res.status(404).end();
  }
};

// @route  PUT /api/photos/:doctorId   @access Private/Admin
// Body: { image: "data:image/jpeg;base64,...." }  (the page shrinks it before sending)
export const uploadPhoto = async (req, res) => {
  try {
    const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(req.body.image || "");
    if (!match) return res.status(400).json({ message: "Please upload a JPG, PNG or WebP image." });
    const data = Buffer.from(match[2], "base64");
    if (data.length > MAX_BYTES) return res.status(400).json({ message: "That image is too large. Please use a smaller one." });

    const doctor = await User.findOne({ _id: req.params.doctorId, role: "doctor" });
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    const existing = await DoctorPhoto.findOne({ doctor: doctor._id });
    if (existing) {
      await DoctorPhoto.findOneAndUpdate({ _id: existing._id }, { $set: { contentType: match[1], data } });
    } else {
      await DoctorPhoto.create({ doctor: doctor._id, contentType: match[1], data });
    }
    res.json({ message: "Photo saved" });
  } catch (error) {
    res.status(500).json({ message: "Could not save the photo" });
  }
};

// @route  DELETE /api/photos/:doctorId   @access Private/Admin
export const deletePhoto = async (req, res) => {
  try {
    await DoctorPhoto.findOneAndDelete({ doctor: req.params.doctorId });
    res.json({ message: "Photo removed" });
  } catch (error) {
    res.status(500).json({ message: "Could not remove the photo" });
  }
};

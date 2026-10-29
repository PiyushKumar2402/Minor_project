import User from "../models/User.js";
import Appointment from "../models/Appointment.js";
import Review from "../models/Review.js";

// @route  GET /api/public/stats   @access Public
// Real numbers for the home page strip.
export const getPublicStats = async (req, res) => {
  try {
    const [doctors, appointments, reviews] = await Promise.all([
      User.find({ role: "doctor" }).select("specialization"),
      Appointment.countDocuments({ status: { $in: ["booked", "waiting", "in-consultation", "completed", "no-show"] } }),
      Review.find({}),
    ]);
    res.json({
      doctors: doctors.length,
      specialities: new Set(doctors.map((d) => d.specialization).filter(Boolean)).size,
      appointments,
      reviews: reviews.length,
      rating: reviews.length ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10 : null,
    });
  } catch (error) {
    res.status(500).json({ message: "Could not load stats" });
  }
};

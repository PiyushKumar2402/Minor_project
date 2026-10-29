import Review from "../models/Review.js";
import Appointment from "../models/Appointment.js";

const shortName = (full) => {
  const parts = String(full || "Patient").trim().split(/\s+/);
  return parts[0] + (parts[1] ? ` ${parts[1][0].toUpperCase()}.` : "");
};

const summarise = (rows) => ({
  count: rows.length,
  average: rows.length ? Math.round((rows.reduce((s, r) => s + r.rating, 0) / rows.length) * 10) / 10 : null,
});

// @route  POST /api/reviews   @access Private/Patient
// Body: { appointmentId, rating (1-5), comment }
export const createReview = async (req, res) => {
  try {
    const { appointmentId, comment } = req.body;
    const rating = Number(req.body.rating);
    const text = String(comment || "").trim();

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Please choose a rating from 1 to 5 stars." });
    }
    if (text.length < 10) return res.status(400).json({ message: "Please tell us a little more (at least 10 characters)." });
    if (text.length > 600) return res.status(400).json({ message: "Please keep your review under 600 characters." });

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });
    if (appointment.patient.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: "You can only review your own appointments" });
    }
    if (appointment.status !== "completed") {
      return res.status(400).json({ message: "You can review a visit after it has been completed." });
    }
    if (await Review.findOne({ appointment: appointment._id })) {
      return res.status(409).json({ message: "You have already reviewed this visit." });
    }

    const review = await Review.create({
      patient: req.user.id,
      doctor: appointment.doctor,
      appointment: appointment._id,
      rating,
      comment: text,
    });
    res.status(201).json({ message: "Thank you for your review!", id: review._id });
  } catch (error) {
    // two quick clicks can race past the check above; the unique index catches it
    if (error.code === 11000) return res.status(409).json({ message: "You have already reviewed this visit." });
    res.status(500).json({ message: "Could not save your review" });
  }
};

// @route  GET /api/reviews?doctor=<id>&limit=30   @access Public
export const listReviews = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 30, 100);
    const filter = req.query.doctor ? { doctor: req.query.doctor } : {};
    const all = await Review.find(filter).sort({ createdAt: -1 }).populate("patient", "name").populate("doctor", "name");
    res.json({
      summary: summarise(all),
      reviews: all.slice(0, limit).map((r) => ({
        _id: r._id,
        rating: r.rating,
        comment: r.comment,
        patientName: shortName(r.patient?.name),
        doctorName: r.doctor?.name ? `Dr. ${r.doctor.name}` : "",
        createdAt: r.createdAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: "Could not load reviews" });
  }
};

// @route  GET /api/reviews/mine   @access Private/Patient
// Appointment ids this patient has already reviewed
export const myReviewedAppointments = async (req, res) => {
  try {
    const mine = await Review.find({ patient: req.user.id });
    res.json(mine.map((r) => r.appointment.toString()));
  } catch (error) {
    res.status(500).json({ message: "Could not load your reviews" });
  }
};

// @route  DELETE /api/reviews/:id   @access Private/Admin (moderation)
export const deleteReview = async (req, res) => {
  try {
    const gone = await Review.findByIdAndDelete(req.params.id);
    if (!gone) return res.status(404).json({ message: "Review not found" });
    res.json({ message: "Review removed" });
  } catch (error) {
    res.status(500).json({ message: "Could not remove the review" });
  }
};

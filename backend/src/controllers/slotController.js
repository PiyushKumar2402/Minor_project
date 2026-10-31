import Availability from "../models/Availability.js";
import Slot from "../models/Slot.js";
import { generateSlotTimes, getDayNameFromDate } from "../utils/slotGenerator.js";

const DATE_FORMAT_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// @route  GET /api/slots/:doctorId?date=YYYY-MM-DD
// @access Public
// Generates the day's slots when first requested, and keeps them in step with the
// doctor's current hours on every later request.
export const getSlotsForDate = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date || !DATE_FORMAT_REGEX.test(date)) {
      return res.status(400).json({ message: "A valid date query param is required, format YYYY-MM-DD" });
    }

    // Don't allow generating/viewing slots for days already in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const requestedDate = new Date(date + "T00:00:00");
    if (requestedDate < today) {
      return res.status(400).json({ message: "Cannot fetch slots for a past date" });
    }

    const availability = await Availability.findOne({ doctor: doctorId });
    if (!availability) {
      return res.status(404).json({ message: "This doctor has not set their availability yet" });
    }

    const dayName = getDayNameFromDate(date);
    const daySchedule = availability.schedule.find((d) => d.day === dayName);

    if (!daySchedule || daySchedule.isOff) {
      return res.json({ date, day: dayName, isOff: true, slots: [] });
    }

    // Keep the day's slots in step with the doctor's current hours:
    //  - add any slot that is missing (e.g. the doctor extended the hours),
    //  - remove still-available slots that are no longer inside the hours,
    //  - never touch booked slots.
    const generated = generateSlotTimes(daySchedule.startTime, daySchedule.endTime, availability.slotDurationMinutes);
    const wanted = new Set(generated.map((s) => s.startTime));
    let slots = await Slot.find({ doctor: doctorId, date }).sort({ startTime: 1 });
    const have = new Set(slots.map((s) => s.startTime));

    const missing = generated.filter((s) => !have.has(s.startTime));
    const stale = slots.filter((s) => s.status === "available" && !wanted.has(s.startTime)).map((s) => s._id);

    if (missing.length > 0 || stale.length > 0) {
      if (stale.length > 0) await Slot.deleteMany({ _id: { $in: stale }, status: "available" });
      if (missing.length > 0) {
        try {
          await Slot.insertMany(
            missing.map((s) => ({ doctor: doctorId, date, startTime: s.startTime, endTime: s.endTime, status: "available" })),
            { ordered: false }
          );
        } catch (insertError) {
          // a parallel request may have inserted the same slots; the re-fetch below returns whatever exists
        }
      }
      slots = await Slot.find({ doctor: doctorId, date }).sort({ startTime: 1 });
    }

    res.json({ date, day: dayName, isOff: false, slots });
  } catch (error) {
    res.status(500).json({ message: "Could not fetch slots", error: error.message });
  }
};

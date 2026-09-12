import Availability from "../models/Availability.js";
import Slot from "../models/Slot.js";
import { generateSlotTimes, getDayNameFromDate } from "../utils/slotGenerator.js";

const DATE_FORMAT_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// @route  GET /api/slots/:doctorId?date=YYYY-MM-DD
// @access Public
// Automatically generates the day's slots the first time they're requested,
// then returns the same persisted slots (with live status) on every later request.
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

    // If slots already exist for this doctor+date, just return them (don't regenerate)
    let slots = await Slot.find({ doctor: doctorId, date }).sort({ startTime: 1 });

    if (slots.length === 0) {
      const generated = generateSlotTimes(daySchedule.startTime, daySchedule.endTime, availability.slotDurationMinutes);

      if (generated.length > 0) {
        const docs = generated.map((s) => ({
          doctor: doctorId,
          date,
          startTime: s.startTime,
          endTime: s.endTime,
          status: "available",
        }));

        try {
          slots = await Slot.insertMany(docs, { ordered: false });
        } catch (insertError) {
          // In case of a rare race condition (two requests generating at once),
          // just re-fetch whatever ended up persisted rather than failing the request.
          slots = await Slot.find({ doctor: doctorId, date }).sort({ startTime: 1 });
        }
      }
    }

    res.json({ date, day: dayName, isOff: false, slots });
  } catch (error) {
    res.status(500).json({ message: "Could not fetch slots", error: error.message });
  }
};

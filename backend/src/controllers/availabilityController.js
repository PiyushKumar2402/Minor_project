import Availability, { DAYS } from "../models/Availability.js";

// @route  GET /api/availability/me
// @access Private/Doctor
export const getMyAvailability = async (req, res) => {
  try {
    let availability = await Availability.findOne({ doctor: req.user.id });

    if (!availability) {
      // First time this doctor is viewing their schedule — create a default (all OFF)
      availability = await Availability.create({ doctor: req.user.id });
    }

    res.json(availability);
  } catch (error) {
    res.status(500).json({ message: "Could not fetch availability", error: error.message });
  }
};

// @route  PUT /api/availability/me
// @access Private/Doctor
// Body: { slotDurationMinutes, schedule: [{ day, isOff, startTime, endTime }, ...] }
export const updateMyAvailability = async (req, res) => {
  try {
    const { slotDurationMinutes, schedule } = req.body;

    if (schedule) {
      const validDays = new Set(DAYS);
      for (const entry of schedule) {
        if (!validDays.has(entry.day)) {
          return res.status(400).json({ message: `Invalid day: ${entry.day}` });
        }
        if (!entry.isOff && entry.startTime >= entry.endTime) {
          return res.status(400).json({ message: `${entry.day}: start time must be before end time` });
        }
      }
    }

    const availability = await Availability.findOneAndUpdate(
      { doctor: req.user.id },
      {
        $set: {
          ...(slotDurationMinutes && { slotDurationMinutes }),
          ...(schedule && { schedule }),
        },
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.json(availability);
  } catch (error) {
    res.status(500).json({ message: "Could not update availability", error: error.message });
  }
};

// @route  GET /api/availability/:doctorId
// @access Public
// Lets patients see a doctor's weekly hours before picking a date
export const getAvailabilityByDoctorId = async (req, res) => {
  try {
    const availability = await Availability.findOne({ doctor: req.params.doctorId });
    if (!availability) {
      return res.status(404).json({ message: "This doctor has not set their availability yet" });
    }
    res.json(availability);
  } catch (error) {
    res.status(500).json({ message: "Could not fetch availability", error: error.message });
  }
};

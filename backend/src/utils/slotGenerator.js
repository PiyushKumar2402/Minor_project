// Converts "HH:MM" to minutes since midnight, e.g. "10:15" -> 615
export const timeToMinutes = (time) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

// Converts minutes since midnight back to "HH:MM"
export const minutesToTime = (totalMinutes) => {
  const h = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (totalMinutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
};

// Builds the list of { startTime, endTime } slots between startTime and endTime,
// in steps of slotDurationMinutes. Drops a trailing partial slot if it doesn't fit.
export const generateSlotTimes = (startTime, endTime, slotDurationMinutes) => {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const slots = [];

  for (let t = startMinutes; t + slotDurationMinutes <= endMinutes; t += slotDurationMinutes) {
    slots.push({
      startTime: minutesToTime(t),
      endTime: minutesToTime(t + slotDurationMinutes),
    });
  }

  return slots;
};

// Given a "YYYY-MM-DD" date string, returns the weekday name ("Monday", etc.)
// without timezone drift (parses as local calendar date, not UTC midnight).
export const getDayNameFromDate = (dateStr) => {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[date.getDay()];
};

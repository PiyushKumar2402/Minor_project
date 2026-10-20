// "Today" as a YYYY-MM-DD string in the clinic's timezone, not the server's or UTC.
// Queue actions only make sense for today's appointments, so this must be right
// even when the server runs in a different timezone from the clinic.
export const todayInClinic = (now = new Date()) => {
  const timeZone = process.env.CLINIC_TIMEZONE || "Asia/Kolkata";
  // The en-CA locale formats dates as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(now);
};

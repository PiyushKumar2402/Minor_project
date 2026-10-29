import Appointment from "../models/Appointment.js";
import User from "../models/User.js";
import { sendEmail } from "./mailer.js";
import { buildReminderEmail } from "./reminderEmail.js";
import { todayInClinic } from "./clinicDate.js";

const LEFT_OPEN = ["booked", "waiting", "in-consultation"];
const CHECK_EVERY_MS = 30 * 60 * 1000; // every 30 minutes

// 1) Close appointments from earlier days that were never finished, so history is accurate.
//    booked / waiting  -> no-show        in-consultation -> completed
export const sweepStaleAppointments = async () => {
  const today = todayInClinic();
  const stale = (await Appointment.find({ status: { $in: LEFT_OPEN } })).filter((a) => a.date < today);
  let closed = 0;
  for (const a of stale) {
    const next = a.status === "in-consultation" ? "completed" : "no-show";
    const set = { status: next };
    if (next === "completed") set.completedAt = new Date();
    // conditional update so a late action by the doctor isn't overwritten
    const done = await Appointment.findOneAndUpdate({ _id: a._id, status: a.status }, { $set: set }, { new: true });
    if (done) closed += 1;
  }
  return closed;
};

// 2) Email a reminder for tomorrow's still-booked appointments, once each.
export const sendTomorrowReminders = async () => {
  const tomorrow = todayInClinic(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const due = (await Appointment.find({ date: tomorrow, status: "booked" })).filter((a) => !a.reminderSentAt);
  let sent = 0;
  for (const a of due) {
    // Claim first so two runs (or two servers) can't send the same reminder twice
    const claimed = await Appointment.findOneAndUpdate(
      { _id: a._id, reminderSentAt: null },
      { $set: { reminderSentAt: new Date() } },
      { new: true }
    );
    if (!claimed) continue;
    try {
      const [doctor, patient] = await Promise.all([
        User.findById(a.doctor).select("name"),
        User.findById(a.patient).select("name email"),
      ]);
      if (!doctor || !patient?.email) continue;
      const result = await sendEmail(buildReminderEmail({ appointment: claimed, doctor, patient }));
      if (result && result.sent === false) {
        // email isn't configured / failed: release the claim so a later run can retry
        await Appointment.findOneAndUpdate({ _id: a._id }, { $set: { reminderSentAt: null } });
      } else {
        sent += 1;
      }
    } catch (err) {
      console.error("[reminder] failed:", err.message);
      await Appointment.findOneAndUpdate({ _id: a._id }, { $set: { reminderSentAt: null } }).catch(() => {});
    }
  }
  return sent;
};

export const runMaintenance = async () => {
  try {
    const closed = await sweepStaleAppointments();
    const reminders = await sendTomorrowReminders();
    if (closed || reminders) console.log(`[scheduler] closed ${closed} stale appointment(s), sent ${reminders} reminder(s)`);
  } catch (err) {
    console.error("[scheduler] error:", err.message);
  }
};

export const startScheduler = () => {
  setTimeout(runMaintenance, 10 * 1000); // shortly after the server starts
  setInterval(runMaintenance, CHECK_EVERY_MS);
  console.log("[scheduler] started (stale-appointment sweep + next-day reminders every 30 min)");
};

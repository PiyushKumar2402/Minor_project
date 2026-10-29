import { formatDate, formatTime, appointmentRef } from "./emailTemplates.js";

const esc = (v) =>
  String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Reminder sent the day before an appointment.
export const buildReminderEmail = ({ appointment, doctor, patient }) => {
  const isOnline = appointment.mode === "online";
  const date = formatDate(appointment.date);
  const time = formatTime(appointment.startTime);
  const hospital = process.env.HOSPITAL_NAME || "ABC Hospital";

  const rows = [
    ["Doctor", `Dr. ${doctor.name}`],
    ["Date", date],
    ["Time", time],
    ["Mode", isOnline ? "Online (Zoom)" : "In-Person"],
    ["Queue Number", appointment.queueNumber],
    ["Appointment ID", appointmentRef(appointment._id)],
  ];
  if (!isOnline && appointment.room) rows.splice(4, 0, ["Room", appointment.room]);

  const tip = isOnline
    ? "Please join a few minutes before your scheduled time."
    : "Please arrive 10 minutes early and mention your queue number at the desk.";
  const joinHtml =
    isOnline && appointment.meetingJoinUrl
      ? `<p style="margin:20px 0 0 0;"><a href="${esc(appointment.meetingJoinUrl)}" style="display:inline-block;background:#028090;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;">Join Zoom Meeting</a></p>`
      : "";

  const html = `
<div style="font-family:Segoe UI,Arial,sans-serif;background:#f4faf9;padding:24px;">
  <table role="presentation" width="100%" style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #dbe8e6;border-radius:10px;overflow:hidden;">
    <tr><td style="background:#028090;color:#fff;padding:18px 24px;font-size:18px;font-weight:600;">${esc(hospital)}</td></tr>
    <tr><td style="padding:24px;">
      <h2 style="margin:0 0 8px 0;color:#1a2e30;">Appointment Reminder</h2>
      <p style="margin:0 0 16px 0;color:#2b2b2b;">Hello ${esc(patient.name)}, this is a reminder that you have an appointment tomorrow.</p>
      <table role="presentation" width="100%" style="border-collapse:collapse;">
        ${rows.map(([l, v]) => `<tr><td style="padding:8px 0;color:#6b7a7a;width:150px;border-bottom:1px solid #eef3f2;">${esc(l)}</td><td style="padding:8px 0;color:#1a2e30;font-weight:600;border-bottom:1px solid #eef3f2;">${esc(v)}</td></tr>`).join("")}
      </table>
      ${joinHtml}
      <p style="margin:20px 0 0 0;color:#6b7a7a;font-size:12px;">${esc(tip)} Need to cancel? Do it from My Appointments before you check in.</p>
    </td></tr>
  </table>
</div>`;

  return {
    to: patient.email,
    subject: `Reminder: appointment tomorrow, ${date} at ${time}`,
    html,
    text: [`Appointment Reminder`, "", `Hello ${patient.name}, you have an appointment tomorrow.`, "", ...rows.map(([l, v]) => `${l}: ${v}`), ...(isOnline && appointment.meetingJoinUrl ? ["", `Join Zoom Meeting: ${appointment.meetingJoinUrl}`] : []), "", tip].join("\n"),
  };
};

import { formatDate, formatTime, appointmentRef } from "./emailTemplates.js";

// Emails that go to the DOCTOR when something happens to one of their appointments.

const esc = (v) =>
  String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const hospital = () => process.env.HOSPITAL_NAME || "ABC Hospital";

const wrap = ({ heading, intro, rows, note }) => `
<div style="font-family:Segoe UI,Arial,sans-serif;background:#f4f6fa;padding:24px;">
  <table role="presentation" width="100%" style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #dde3ec;border-radius:10px;overflow:hidden;">
    <tr><td style="background:#1a4480;color:#fff;padding:18px 24px;font-size:18px;font-weight:600;">${esc(hospital())}</td></tr>
    <tr><td style="padding:24px;">
      <h2 style="margin:0 0 8px 0;color:#0f2140;">${esc(heading)}</h2>
      <p style="margin:0 0 16px 0;color:#28364d;">${intro}</p>
      <table role="presentation" width="100%" style="border-collapse:collapse;">
        ${rows.map(([l, v]) => `<tr><td style="padding:8px 0;color:#66758c;width:150px;border-bottom:1px solid #eef1f6;vertical-align:top;">${esc(l)}</td><td style="padding:8px 0;color:#0f2140;font-weight:600;border-bottom:1px solid #eef1f6;">${esc(v)}</td></tr>`).join("")}
      </table>
      ${note ? `<p style="margin:18px 0 0 0;color:#66758c;font-size:12px;">${esc(note)}</p>` : ""}
    </td></tr>
  </table>
</div>`;

const text = (heading, rows) => [heading, "", ...rows.map(([l, v]) => `${l}: ${v}`)].join("\n");

const patientRows = (patient, appointment) => {
  const rows = [["Patient", patient.name]];
  if (patient.phone) rows.push(["Phone", patient.phone]);
  if (patient.email) rows.push(["Email", patient.email]);
  rows.push(["Reason for visit", appointment.reason || "Not given"]);
  return rows;
};

const visitRows = (appointment) => {
  const rows = [
    ["Date", formatDate(appointment.date)],
    ["Time", formatTime(appointment.startTime)],
    ["Mode", appointment.mode === "online" ? "Online (Zoom)" : "In-Person"],
    ["Queue Number", appointment.queueNumber],
    ["Appointment ID", appointmentRef(appointment._id)],
  ];
  return rows;
};

// New booking
export const buildDoctorNewAppointmentEmail = ({ appointment, doctor, patient }) => {
  const rows = [...patientRows(patient, appointment), ...visitRows(appointment)];
  const heading = "New appointment";
  const when = `${formatDate(appointment.date)}, ${formatTime(appointment.startTime)}`;
  return {
    to: doctor.email,
    subject: `New appointment: ${patient.name}, ${when}`,
    html: wrap({
      heading,
      intro: `Hello Dr. ${esc(doctor.name)}, you have a new appointment with <b>${esc(patient.name)}</b>.`,
      rows,
      note: appointment.mode === "online" ? "Start the Zoom meeting from your dashboard when it is time." : "",
    }),
    text: text(`${heading}\n\nHello Dr. ${doctor.name}, you have a new appointment with ${patient.name}.`, rows),
  };
};

// Patient cancelled
export const buildDoctorCancellationEmail = ({ appointment, doctor, patient }) => {
  const rows = [...patientRows(patient, appointment), ...visitRows(appointment)];
  const when = `${formatDate(appointment.date)}, ${formatTime(appointment.startTime)}`;
  return {
    to: doctor.email,
    subject: `Appointment cancelled: ${patient.name}, ${when}`,
    html: wrap({
      heading: "Appointment cancelled",
      intro: `Hello Dr. ${esc(doctor.name)}, <b>${esc(patient.name)}</b> has cancelled this appointment. The slot is free again.`,
      rows,
    }),
    text: text(`Appointment cancelled\n\nHello Dr. ${doctor.name}, ${patient.name} has cancelled this appointment.`, rows),
  };
};

// Patient moved it. `before` = { date, startTime } of the old time.
export const buildDoctorRescheduleEmail = ({ appointment, doctor, patient, before }) => {
  const rows = [
    ...patientRows(patient, appointment),
    ["Was", `${formatDate(before.date)}, ${formatTime(before.startTime)}`],
    ["Now", `${formatDate(appointment.date)}, ${formatTime(appointment.startTime)}`],
    ["Mode", appointment.mode === "online" ? "Online (Zoom)" : "In-Person"],
    ["Queue Number", appointment.queueNumber],
    ["Appointment ID", appointmentRef(appointment._id)],
  ];
  return {
    to: doctor.email,
    subject: `Appointment rescheduled: ${patient.name}, now ${formatDate(appointment.date)}, ${formatTime(appointment.startTime)}`,
    html: wrap({
      heading: "Appointment rescheduled",
      intro: `Hello Dr. ${esc(doctor.name)}, <b>${esc(patient.name)}</b> has moved their appointment to a new time.`,
      rows,
    }),
    text: text(`Appointment rescheduled\n\nHello Dr. ${doctor.name}, ${patient.name} has moved their appointment.`, rows),
  };
};

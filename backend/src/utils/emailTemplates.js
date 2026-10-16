// Builds the subject + HTML + plain-text bodies for appointment emails.
// Patient/doctor names are user-supplied, so everything is HTML-escaped.

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// "2026-08-18" -> "18 August 2026"
export const formatDate = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};

// "13:05" -> "1:05 PM"
export const formatTime = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
};

// Short, readable reference built from the database id, e.g. "APT-3F9A1C"
export const appointmentRef = (id) => "APT-" + String(id).slice(-6).toUpperCase();

const hospitalName = () => process.env.HOSPITAL_NAME || "ABC Hospital";

// Wraps rows in a simple, email-safe (table + inline CSS) layout
const layout = ({ heading, intro, rows, extraHtml = "", footer }) => `
<div style="font-family:Segoe UI,Arial,sans-serif;background:#f4faf9;padding:24px;">
  <table role="presentation" width="100%" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #dbe8e6;border-radius:10px;overflow:hidden;">
    <tr><td style="background:#028090;color:#ffffff;padding:18px 24px;font-size:18px;font-weight:600;">${escapeHtml(hospitalName())}</td></tr>
    <tr><td style="padding:24px;">
      <h2 style="margin:0 0 8px 0;color:#1a2e30;">${escapeHtml(heading)}</h2>
      <p style="margin:0 0 16px 0;color:#2b2b2b;">${intro}</p>
      <table role="presentation" width="100%" style="border-collapse:collapse;">
        ${rows
          .map(
            ([label, value]) => `
        <tr>
          <td style="padding:8px 0;color:#6b7a7a;width:150px;border-bottom:1px solid #eef3f2;">${escapeHtml(label)}</td>
          <td style="padding:8px 0;color:#1a2e30;font-weight:600;border-bottom:1px solid #eef3f2;">${value}</td>
        </tr>`
          )
          .join("")}
      </table>
      ${extraHtml}
      <p style="margin:20px 0 0 0;color:#6b7a7a;font-size:12px;">${footer}</p>
    </td></tr>
  </table>
</div>`;

const toText = (heading, rows, extraLines = []) =>
  [heading, "", ...rows.map(([label, value]) => `${label}: ${value}`), ...extraLines].join("\n");

// ---------- Booking confirmation ----------
// appointment: the saved Appointment (plain object or document)
// doctor: { name, specialization }, patient: { name, email }
export const buildBookingEmail = ({ appointment, doctor, patient }) => {
  const isOnline = appointment.mode === "online";
  const date = formatDate(appointment.date);
  const time = formatTime(appointment.startTime);
  const ref = appointmentRef(appointment._id);

  // Each row: [plain-text label, plain-text value, html value]
  const base = [
    ["Doctor", `Dr. ${doctor.name}`],
    ["Date", date],
    ["Time", time],
    ["Mode", isOnline ? "Online (Zoom)" : "In-Person"],
  ];

  let modeRows;
  let extraHtml = "";
  let extraText = [];

  if (isOnline) {
    modeRows = [["Meeting ID", appointment.meetingId]];
    if (appointment.meetingPassword) modeRows.push(["Passcode", appointment.meetingPassword]);
    modeRows.push(["Queue Number", appointment.queueNumber]);

    extraHtml = `
      <p style="margin:20px 0 0 0;">
        <a href="${escapeHtml(appointment.meetingJoinUrl)}" style="display:inline-block;background:#028090;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;">Join Zoom Meeting</a>
      </p>
      <p style="margin:10px 0 0 0;color:#6b7a7a;font-size:12px;word-break:break-all;">${escapeHtml(appointment.meetingJoinUrl)}</p>
      ${
        appointment.meetingIsDemo
          ? `<p style="margin:10px 0 0 0;color:#d64545;font-size:12px;">Demo link: Zoom is not connected on this system, so this is a placeholder and not a real meeting.</p>`
          : ""
      }`;
    extraText = ["", `Join Zoom Meeting: ${appointment.meetingJoinUrl}`];
    if (appointment.meetingIsDemo) extraText.push("(Demo link - Zoom is not connected, not a real meeting)");
  } else {
    modeRows = [["Hospital", hospitalName()]];
    if (appointment.room) modeRows.push(["Room", appointment.room]);
    modeRows.push(["Queue Number", appointment.queueNumber]);
  }

  const rows = [...base, ...modeRows, ["Appointment ID", ref]];

  const intro = `Hello ${escapeHtml(patient.name)}, your appointment is confirmed.`;
  const footer = isOnline
    ? "Please join a few minutes before your scheduled time."
    : "Please arrive 10 minutes early and mention your queue number at the desk.";

  return {
    to: patient.email,
    subject: `Appointment Confirmed - ${date}, ${time}`,
    html: layout({
      heading: "Appointment Confirmed",
      intro,
      rows: rows.map(([l, v]) => [l, escapeHtml(v)]),
      extraHtml,
      footer,
    }),
    text: toText(`Appointment Confirmed\n\nHello ${patient.name}, your appointment is confirmed.`, rows, [
      ...extraText,
      "",
      footer,
    ]),
  };
};

// ---------- Cancellation confirmation ----------
export const buildCancellationEmail = ({ appointment, doctor, patient }) => {
  const date = formatDate(appointment.date);
  const time = formatTime(appointment.startTime);
  const rows = [
    ["Doctor", `Dr. ${doctor.name}`],
    ["Date", date],
    ["Time", time],
    ["Mode", appointment.mode === "online" ? "Online (Zoom)" : "In-Person"],
    ["Appointment ID", appointmentRef(appointment._id)],
  ];
  const footer = "You can book a new appointment any time from the Find a Doctor page.";

  return {
    to: patient.email,
    subject: `Appointment Cancelled - ${date}, ${time}`,
    html: layout({
      heading: "Appointment Cancelled",
      intro: `Hello ${escapeHtml(patient.name)}, your appointment has been cancelled and the slot has been released.`,
      rows: rows.map(([l, v]) => [l, escapeHtml(v)]),
      footer,
    }),
    text: toText(
      `Appointment Cancelled\n\nHello ${patient.name}, your appointment has been cancelled and the slot has been released.`,
      rows,
      ["", footer]
    ),
  };
};

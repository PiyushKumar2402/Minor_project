import nodemailer from "nodemailer";

// Gmail sending via Nodemailer.
// Needs GMAIL_USER and GMAIL_APP_PASSWORD in backend/.env
// (an App Password, NOT your normal Gmail password).
//
// sendEmail() never throws. If Gmail isn't configured, or sending fails, it logs
// to the backend console and returns { sent: false } so a booking or cancellation
// is never blocked by an email problem.

let transporter = null;

const getCredentials = () => ({
  user: (process.env.GMAIL_USER || "").trim(),
  // Google shows app passwords as "abcd efgh ijkl mnop" — spaces must be removed
  pass: (process.env.GMAIL_APP_PASSWORD || "").replace(/\s/g, ""),
});

const isConfigured = () => {
  const { user, pass } = getCredentials();
  return Boolean(user && pass);
};

const getTransporter = () => {
  if (!transporter) {
    const { user, pass } = getCredentials();
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });
  }
  return transporter;
};

export const sendEmail = async ({ to, subject, html, text }) => {
  if (!to) {
    console.warn("[email skipped] no recipient address");
    return { sent: false, skipped: true };
  }

  if (!isConfigured()) {
    console.log(`[email skipped - Gmail not configured] To: ${to} | Subject: ${subject}`);
    return { sent: false, skipped: true };
  }

  try {
    const { user } = getCredentials();
    const fromName = process.env.HOSPITAL_NAME || "Doctor Appointment System";
    await getTransporter().sendMail({
      from: `"${fromName}" <${user}>`,
      to,
      subject,
      html,
      text,
    });
    console.log(`[email sent] To: ${to} | Subject: ${subject}`);
    return { sent: true };
  } catch (error) {
    console.error(`[email failed] To: ${to} | ${error.message}`);
    return { sent: false, error: error.message };
  }
};

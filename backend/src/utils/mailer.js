import nodemailer from "nodemailer";

// Email sending.
//  - On Render (free plan) SMTP ports are blocked, so we send through Brevo's web API
//    when BREVO_API_KEY is set. Sender = BREVO_SENDER (a sender verified in Brevo).
//  - Otherwise (your own computer) it uses Gmail through Nodemailer:
//    GMAIL_USER + GMAIL_APP_PASSWORD (an App Password, NOT your normal password).
//
// sendEmail() never throws. If sending fails it logs and returns { sent: false },
// so a booking or cancellation is never blocked by an email problem.

let transporter = null;

const gmailCreds = () => ({
  user: (process.env.GMAIL_USER || "").trim(),
  pass: (process.env.GMAIL_APP_PASSWORD || "").replace(/\s/g, ""),
});

const brevoKey = () => (process.env.BREVO_API_KEY || "").trim();
const brevoSender = () => (process.env.BREVO_SENDER || process.env.GMAIL_USER || "").trim();

const getTransporter = () => {
  if (!transporter) {
    const { user, pass } = gmailCreds();
    transporter = nodemailer.createTransport({ service: "gmail", auth: { user, pass } });
  }
  return transporter;
};

const sendWithBrevo = async ({ to, subject, html, text }) => {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": brevoKey(), "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: { name: process.env.HOSPITAL_NAME || "Doctor Appointment System", email: brevoSender() },
      to: [{ email: to }],
      subject,
      htmlContent: html || `<p>${text || ""}</p>`,
      textContent: text || undefined,
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Brevo ${res.status}: ${(await res.text()).slice(0, 200)}`);
};

export const sendEmail = async ({ to, subject, html, text }) => {
  if (!to) {
    console.warn("[email skipped] no recipient address");
    return { sent: false, skipped: true };
  }

  const useBrevo = Boolean(brevoKey() && brevoSender());
  const { user, pass } = gmailCreds();
  if (!useBrevo && !(user && pass)) {
    console.log(`[email skipped - email not configured] To: ${to} | Subject: ${subject}`);
    return { sent: false, skipped: true };
  }

  try {
    if (useBrevo) {
      await sendWithBrevo({ to, subject, html, text });
    } else {
      const fromName = process.env.HOSPITAL_NAME || "Doctor Appointment System";
      await getTransporter().sendMail({ from: `"${fromName}" <${user}>`, to, subject, html, text });
    }
    console.log(`[email sent] To: ${to} | Subject: ${subject}`);
    return { sent: true };
  } catch (error) {
    console.error(`[email failed] To: ${to} | ${error.message}`);
    return { sent: false, error: error.message };
  }
};

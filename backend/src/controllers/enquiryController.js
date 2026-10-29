import Enquiry from "../models/Enquiry.js";
import { sendEmail } from "../utils/mailer.js";

const TYPES = ["General enquiry", "Appointment help", "Feedback", "Complaint", "Other"];

// Tiny in-memory limiter: max 5 enquiries per IP per hour (the form is public)
const hits = new Map();
const tooMany = (ip) => {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 60 * 60 * 1000);
  if (recent.length >= 5) { hits.set(ip, recent); return true; }
  recent.push(now);
  hits.set(ip, recent);
  return false;
};

const esc = (v) => String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// @route  POST /api/enquiries   @access Public
export const createEnquiry = async (req, res) => {
  try {
    if (tooMany(req.ip)) {
      return res.status(429).json({ message: "Too many enquiries from this connection. Please try again later." });
    }
    const { type, name, email, phone, message } = req.body;

    if (!TYPES.includes(type)) return res.status(400).json({ message: "Please choose an enquiry type." });
    if (!name?.trim()) return res.status(400).json({ message: "Please enter your name." });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || "")) return res.status(400).json({ message: "Please enter a valid email address." });
    if (!/^[+\d][\d\s-]{6,17}$/.test(phone || "")) return res.status(400).json({ message: "Please enter a valid phone number." });
    if (!message?.trim()) return res.status(400).json({ message: "Please write your query." });

    const enquiry = await Enquiry.create({ type, name, email, phone, message });

    // Optional: forward to the clinic's inbox when CLINIC_EMAIL is set in backend/.env
    if (process.env.CLINIC_EMAIL) {
      sendEmail({
        to: process.env.CLINIC_EMAIL,
        subject: `New enquiry (${type}) from ${name}`,
        text: `${type}\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\n\n${message}`,
        html: `<p><b>${esc(type)}</b></p><p>Name: ${esc(name)}<br>Email: ${esc(email)}<br>Phone: ${esc(phone)}</p><p>${esc(message).replace(/\n/g, "<br>")}</p>`,
      }).catch(() => {});
    }

    res.status(201).json({ message: "Thank you. We have received your message and will get back to you soon.", id: enquiry._id });
  } catch (error) {
    res.status(500).json({ message: "Could not send your enquiry. Please try again." });
  }
};

// @route  GET /api/enquiries   @access Private/Admin
export const listEnquiries = async (req, res) => {
  try {
    res.json(await Enquiry.find({}).sort({ createdAt: -1 }));
  } catch (error) {
    res.status(500).json({ message: "Could not load enquiries" });
  }
};

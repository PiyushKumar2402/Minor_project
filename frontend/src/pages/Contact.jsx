import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { sendEnquiry } from "../api/enquiries.js";
import { CLINIC } from "../config/clinic.js";

const TYPES = ["General enquiry", "Appointment help", "Feedback", "Complaint", "Other"];

function Contact() {
  const { user } = useAuth();
  const [form, setForm] = useState({ type: "", name: user?.name || "", email: user?.email || "", phone: "", message: "" });
  const [agree, setAgree] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!agree) return setError("Please tick the box so we can contact you.");
    setBusy(true);
    try {
      const res = await sendEnquiry(form);
      setDone(res.message);
      setForm({ type: "", name: "", email: "", phone: "", message: "" });
    } catch (err) {
      setError(err?.response?.data?.message || "Could not send your message. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container">
      <div className="contact-wrap">
        <form className="enq-card" onSubmit={submit} noValidate>
          <h1>Any question or remarks?</h1>
          <p className="muted">Just drop us a message and we will reply.</p>

          {done && <div className="notice ok">{done}</div>}

          <div className="field">
            <label htmlFor="type">Enquiry type *</label>
            <select id="type" value={form.type} onChange={set("type")}>
              <option value="">Select enquiry type</option>
              {TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="name">Name *</label>
              <input id="name" value={form.name} onChange={set("name")} placeholder="Your name" />
            </div>
            <div className="field">
              <label htmlFor="email">Email *</label>
              <input id="email" type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" />
            </div>
          </div>
          <div className="field">
            <label htmlFor="phone">Phone *</label>
            <input id="phone" value={form.phone} onChange={set("phone")} placeholder="Phone number" />
          </div>
          <div className="field">
            <label htmlFor="message">Your query *</label>
            <textarea id="message" rows="5" value={form.message} onChange={set("message")} placeholder="Tell us how we can help" />
          </div>
          <label className="check">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            I agree to be contacted about this enquiry by phone, SMS or email.
          </label>

          {error && <p className="error-text">{error}</p>}
          <button className="btn" disabled={busy}>{busy ? "Sending..." : "Send message"}</button>
        </form>

        <aside className="info-card">
          <div className="info-head">24x7 Enquiry</div>
          <dl>
            <dt>Helpline</dt><dd>{CLINIC.helpline}</dd>
            <dt>Emergency</dt><dd>{CLINIC.emergency}</dd>
            <dt>Email</dt><dd>{CLINIC.email}</dd>
            <dt>Visit us</dt><dd>{CLINIC.address}</dd>
            <dt>Opening hours</dt><dd>{CLINIC.hours}</dd>
          </dl>
        </aside>
      </div>
    </div>
  );
}

export default Contact;

import { useState } from "react";
import { createReview } from "../api/reviews.js";
import StarRating from "./StarRating.jsx";

function ReviewPanel({ appointment, token, onDone, onClose }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    if (!rating) return setError("Please choose a star rating.");
    setBusy(true);
    try {
      await createReview({ appointmentId: appointment._id, rating, comment }, token);
      onDone();
    } catch (e) {
      setError(e?.response?.data?.message || "Could not save your review");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="resched-panel">
      <div className="resched-head">
        <strong>How was your visit with Dr. {appointment.doctor?.name}?</strong>
        <span className="muted small">Your review (with your first name) is shown on our home page.</span>
      </div>
      <StarRating value={rating} onChange={setRating} size={30} />
      <textarea
        rows="3"
        maxLength={600}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Tell us a little about your visit"
        style={{ width: "100%", marginTop: "0.8rem", resize: "vertical" }}
      />
      {error && <p className="error-text">{error}</p>}
      <div className="resched-actions">
        <button className="btn" onClick={submit} disabled={busy}>{busy ? "Saving..." : "Submit review"}</button>
        <button className="btn btn-secondary" onClick={onClose}>Not now</button>
      </div>
    </div>
  );
}

export default ReviewPanel;

import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getDoctorById } from "../api/doctors.js";
import { getSlotsForDate } from "../api/slots.js";

const todayISO = () => new Date().toISOString().split("T")[0];

function DoctorProfile() {
  const { id } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [error, setError] = useState("");
  const [date, setDate] = useState(todayISO());
  const [slotData, setSlotData] = useState(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState("");

  useEffect(() => {
    getDoctorById(id)
      .then(setDoctor)
      .catch(() => setError("Doctor not found"));
  }, [id]);

  useEffect(() => {
    if (!doctor) return;
    setSlotsLoading(true);
    setSlotsError("");
    getSlotsForDate(id, date)
      .then(setSlotData)
      .catch((err) => setSlotsError(err.response?.data?.message || "Could not load slots"))
      .finally(() => setSlotsLoading(false));
  }, [id, date, doctor]);

  if (error) {
    return (
      <div className="container">
        <p className="error-text">{error}</p>
        <Link to="/doctors">Back to doctor list</Link>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="container">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <Link to="/doctors">&larr; Back to doctor list</Link>
      <div className="card" style={{ marginTop: "1rem", maxWidth: 640 }}>
        <h1 style={{ marginTop: 0 }}>{doctor.name}</h1>
        <p className="specialization" style={{ color: "var(--secondary)", fontWeight: 600 }}>
          {doctor.specialization}
        </p>
        {doctor.bio && <p>{doctor.bio}</p>}
        <p>
          <strong>Experience:</strong> {doctor.experienceYears || 0} years
        </p>
        <p>
          <strong>Consultation Fee:</strong> ₹{doctor.consultationFee || 0}
        </p>
      </div>

      <div className="card" style={{ marginTop: "1.25rem", maxWidth: 640 }}>
        <h3 style={{ marginTop: 0 }}>Available Time Slots</h3>
        <div className="form-group" style={{ maxWidth: 220 }}>
          <label>Select a date</label>
          <input type="date" value={date} min={todayISO()} onChange={(e) => setDate(e.target.value)} />
        </div>

        {slotsLoading && <p>Loading slots...</p>}
        {slotsError && <p className="error-text">{slotsError}</p>}

        {slotData && !slotsLoading && !slotsError && (
          <>
            {slotData.isOff ? (
              <p style={{ color: "var(--muted)" }}>
                Dr. {doctor.name.split(" ").slice(-1)} is not available on {slotData.day}s.
              </p>
            ) : slotData.slots.length === 0 ? (
              <p style={{ color: "var(--muted)" }}>No slots configured for this day yet.</p>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.75rem" }}>
                {slotData.slots.map((slot) => (
                  <span
                    key={slot._id}
                    className="btn btn-secondary"
                    style={{
                      cursor: slot.status === "booked" ? "not-allowed" : "default",
                      opacity: slot.status === "booked" ? 0.5 : 1,
                      padding: "0.4rem 0.7rem",
                      fontSize: "0.85rem",
                    }}
                    title={slot.status === "booked" ? "Already booked" : "Available"}
                  >
                    {slot.startTime}
                  </span>
                ))}
              </div>
            )}
            <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginTop: "1rem" }}>
              Booking a slot will be enabled in Stage 5 (Appointment Booking).
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default DoctorProfile;

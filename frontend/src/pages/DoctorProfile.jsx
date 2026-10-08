import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getDoctorById } from "../api/doctors.js";
import { getSlotsForDate } from "../api/slots.js";
import { bookAppointment } from "../api/appointments.js";
import { useAuth } from "../context/AuthContext.jsx";

const todayISO = () => new Date().toISOString().split("T")[0];

function DoctorProfile() {
  const { id } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState(null);
  const [error, setError] = useState("");
  const [date, setDate] = useState(todayISO());
  const [slotData, setSlotData] = useState(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState("");
  const [bookingSlotId, setBookingSlotId] = useState(null);
  const [bookingMessage, setBookingMessage] = useState("");
  const [bookingError, setBookingError] = useState("");

  useEffect(() => {
    getDoctorById(id)
      .then(setDoctor)
      .catch(() => setError("Doctor not found"));
  }, [id]);

  const loadSlots = () => {
    setSlotsLoading(true);
    setSlotsError("");
    getSlotsForDate(id, date)
      .then(setSlotData)
      .catch((err) => setSlotsError(err.response?.data?.message || "Could not load slots"))
      .finally(() => setSlotsLoading(false));
  };

  useEffect(() => {
    if (!doctor) return;
    loadSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, date, doctor]);

  const handleBook = async (slot) => {
    setBookingMessage("");
    setBookingError("");

    if (!user) {
      navigate("/login");
      return;
    }
    if (user.role !== "patient") {
      setBookingError("Only patient accounts can book appointments.");
      return;
    }

    setBookingSlotId(slot._id);
    try {
      const appointment = await bookAppointment(id, slot._id, token);
      setBookingMessage(
        `Booked! Your queue number is ${appointment.queueNumber} for ${appointment.date} at ${appointment.startTime}.`
      );
      loadSlots(); // refresh so the booked slot now shows as unavailable
    } catch (err) {
      setBookingError(err.response?.data?.message || "Could not book this slot");
      loadSlots(); // in case it was a race-condition conflict, refresh to show current state
    } finally {
      setBookingSlotId(null);
    }
  };

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
        <h3 style={{ marginTop: 0 }}>Book an Appointment</h3>
        <div className="form-group" style={{ maxWidth: 220 }}>
          <label>Select a date</label>
          <input type="date" value={date} min={todayISO()} onChange={(e) => setDate(e.target.value)} />
        </div>

        {slotsLoading && <p>Loading slots...</p>}
        {slotsError && <p className="error-text">{slotsError}</p>}

        {slotData && !slotsLoading && !slotsError && (
          <>
            {slotData.isOff ? (
              <p style={{ color: "var(--muted)" }}>Not available on {slotData.day}s.</p>
            ) : slotData.slots.length === 0 ? (
              <p style={{ color: "var(--muted)" }}>No slots configured for this day yet.</p>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.75rem" }}>
                {slotData.slots.map((slot) => {
                  const isBooked = slot.status === "booked";
                  const isSubmitting = bookingSlotId === slot._id;
                  return (
                    <button
                      key={slot._id}
                      className={isBooked ? "btn btn-secondary" : "btn"}
                      disabled={isBooked || isSubmitting}
                      onClick={() => handleBook(slot)}
                      style={{
                        padding: "0.4rem 0.7rem",
                        fontSize: "0.85rem",
                        opacity: isBooked ? 0.5 : 1,
                        cursor: isBooked ? "not-allowed" : "pointer",
                      }}
                      title={isBooked ? "Already booked" : "Click to book this slot"}
                    >
                      {isSubmitting ? "Booking..." : slot.startTime}
                    </button>
                  );
                })}
              </div>
            )}

            {bookingMessage && (
              <p style={{ color: "var(--secondary)", marginTop: "1rem", fontWeight: 600 }}>{bookingMessage}</p>
            )}
            {bookingError && <p className="error-text" style={{ marginTop: "1rem" }}>{bookingError}</p>}

            {!user && (
              <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginTop: "1rem" }}>
                <Link to="/login">Log in</Link> as a patient to book a slot.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default DoctorProfile;

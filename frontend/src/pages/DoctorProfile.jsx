import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getDoctorById } from "../api/doctors.js";
import { getAvailabilityByDoctorId } from "../api/availability.js";
import { getSlotsForDate } from "../api/slots.js";
import { getMyAppointments } from "../api/appointments.js";
import { bookWithReason } from "../api/booking.js";
import { nextDays, todayLocal, prettyDate, formatTime } from "../utils/date.js";
import Avatar from "../components/Avatar.jsx";
import Icon from "../components/Icon.jsx";

const ACTIVE = ["booked", "waiting", "in-consultation"];
const errMsg = (e, fallback) => e?.response?.data?.message || e?.message || fallback;

function DoctorProfile() {
  const { id } = useParams();
  const { user, token } = useAuth();

  const [doctor, setDoctor] = useState(null);
  const [availability, setAvailability] = useState(undefined); // undefined = loading, null = not set
  const [days] = useState(() => nextDays(14));
  const [date, setDate] = useState("");
  const [slotData, setSlotData] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState("in-person");
  const [reason, setReason] = useState("");
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(null);
  const [mine, setMine] = useState([]);

  useEffect(() => {
    getDoctorById(id).then(setDoctor).catch((e) => setError(errMsg(e, "Could not load doctor")));
    getAvailabilityByDoctorId(id).then(setAvailability).catch(() => setAvailability(null));
  }, [id]);

  const loadMine = () => {
    if (user?.role === "patient" && token) {
      getMyAppointments(token).then((d) => setMine(Array.isArray(d) ? d : [])).catch(() => {});
    }
  };
  useEffect(loadMine, [user, token]); // eslint-disable-line react-hooks/exhaustive-deps

  // Which weekdays are working days
  const offDays = useMemo(() => {
    const off = new Set();
    availability?.schedule?.forEach((s) => s.isOff && off.add(s.day));
    return off;
  }, [availability]);
  const isOff = (d) => !availability || offDays.has(d.weekdayLong);

  // Default to the first working day
  useEffect(() => {
    if (!availability || date) return;
    const first = days.find((d) => !isOff(d));
    if (first) setDate(first.iso);
  }, [availability]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!date) return;
    setSelected(null);
    setError("");
    setLoadingSlots(true);
    getSlotsForDate(id, date)
      .then(setSlotData)
      .catch((e) => { setSlotData(null); setError(errMsg(e, "Could not load slots")); })
      .finally(() => setLoadingSlots(false));
  }, [id, date]);

  const nowHHMM = new Date().toTimeString().slice(0, 5);
  const isPast = (s) => date === todayLocal() && s.startTime < nowHHMM;
  const sameDay = mine.find((a) => a.date === date && ACTIVE.includes(a.status));
  const slots = slotData?.slots || [];
  const groups = [
    { label: "Morning", items: slots.filter((s) => s.startTime < "12:00") },
    { label: "Afternoon", items: slots.filter((s) => s.startTime >= "12:00" && s.startTime < "17:00") },
    { label: "Evening", items: slots.filter((s) => s.startTime >= "17:00") },
  ].filter((g) => g.items.length);

  const handleBook = async () => {
    if (!selected) return;
    setBooking(true);
    setError("");
    try {
      const appt = await bookWithReason(id, selected._id, mode, reason.trim(), token);
      setConfirmed(appt);
      setReason("");
      loadMine();
    } catch (e) {
      setError(errMsg(e, "Could not book this slot"));
      getSlotsForDate(id, date).then(setSlotData).catch(() => {});
      setSelected(null);
    } finally {
      setBooking(false);
    }
  };

  if (!doctor) return <div className="container">{error ? <p className="error-text">{error}</p> : "Loading..."}</div>;

  if (confirmed) {
    return (
      <div className="container narrow">
        <div className="confirm-card">
          <span className="confirm-tick"><Icon name="check" size={28} /></span>
          <h2>You're booked!</h2>
          <p className="muted">Dr. {doctor.name} · {prettyDate(confirmed.date)} · {formatTime(confirmed.startTime)}</p>
          <div className="token-chip">
            <span>Queue number</span>
            <strong>{confirmed.queueNumber}</strong>
          </div>
          <p className="muted small">
            {confirmed.mode === "online"
              ? "A Zoom link is in My appointments and your email."
              : confirmed.room ? `Room ${confirmed.room}` : "Visit the clinic at your slot time."}
          </p>
          <div className="hero-actions center">
            <Link to="/my-appointments" className="btn">View my appointments</Link>
            {confirmed.date === todayLocal() && (
              <Link to={`/queue/${confirmed._id}`} className="btn btn-secondary">Track queue</Link>
            )}
            <button className="btn btn-secondary" onClick={() => { setConfirmed(null); setSelected(null); }}>Book another</button>
          </div>
        </div>
      </div>
    );
  }

  const isPatient = user?.role === "patient";
  const picked = slots.find((s) => s._id === selected?._id);

  return (
    <div className="container profile-layout">
      <aside className="card profile-card">
        <Avatar name={doctor.name} doctorId={doctor._id} size={84} />
        <h2>Dr. {doctor.name}</h2>
        <span className="specialization">{doctor.specialization}</span>
        {doctor.bio && <p className="doctor-bio">{doctor.bio}</p>}
        <ul className="facts">
          {doctor.experienceYears != null && <li><Icon name="user" size={16} /> {doctor.experienceYears} years experience</li>}
          {doctor.consultationFee != null && <li><Icon name="info" size={16} /> Fee ₹{doctor.consultationFee}</li>}
          {doctor.roomNumber && <li><Icon name="building" size={16} /> Room {doctor.roomNumber}</li>}
        </ul>
      </aside>

      <section className="booking">
        <h2>Book an appointment</h2>

        {availability === null && <div className="empty">This doctor hasn't set their availability yet.</div>}

        {availability && (
          <>
            <div className="field-label">Visit type</div>
            <div className="segmented">
              <button className={mode === "in-person" ? "is-active" : ""} onClick={() => setMode("in-person")}>
                <Icon name="building" size={16} /> In-person
              </button>
              <button className={mode === "online" ? "is-active" : ""} onClick={() => setMode("online")}>
                <Icon name="video" size={16} /> Online (Zoom)
              </button>
            </div>

            <div className="field-label">Choose a day</div>
            <div className="date-strip">
              {days.map((d) => (
                <button
                  key={d.iso}
                  className={`date-chip ${date === d.iso ? "is-selected" : ""}`}
                  disabled={isOff(d)}
                  onClick={() => setDate(d.iso)}
                  title={isOff(d) ? "Doctor is off" : ""}
                >
                  <span>{d.weekday}</span>
                  <strong>{d.day}</strong>
                  <span>{d.month}</span>
                </button>
              ))}
            </div>

            {sameDay && (
              <div className="notice warn">
                <Icon name="info" size={18} />
                <span>You already have an appointment on this day at {formatTime(sameDay.startTime)}. Only one appointment per day can be booked — cancel it first to pick another time.</span>
              </div>
            )}

            <div className="field-label">Choose a time</div>
            {loadingSlots && <p className="muted">Loading slots...</p>}
            {!loadingSlots && slotData?.isOff && <div className="empty">The doctor is off on this day.</div>}
            {!loadingSlots && slotData && !slotData.isOff && slots.length === 0 && <div className="empty">No slots on this day.</div>}

            {groups.map((g) => (
              <div key={g.label} className="slot-group">
                <div className="slot-group-title">{g.label}</div>
                <div className="slot-grid">
                  {g.items.map((s) => {
                    const free = s.status === "available";
                    return (
                      <button
                        key={s._id}
                        className={`slot-chip ${selected?._id === s._id ? "is-selected" : ""}`}
                        disabled={!free || !!sameDay || isPast(s)}
                        onClick={() => setSelected(s)}
                        aria-pressed={selected?._id === s._id}
                      >
                        {formatTime(s.startTime)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {user?.role === "patient" && (
              <>
                <div className="field-label">Reason for visit (optional)</div>
                <textarea
                  rows="3"
                  maxLength={500}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. chest pain since two days, follow-up of last report"
                  style={{ width: "100%", resize: "vertical" }}
                />
              </>
            )}

            {error && <p className="error-text">{error}</p>}

            <div className="book-bar">
              {picked ? (
                <div className="book-summary">
                  <strong>{prettyDate(date)} · {formatTime(picked.startTime)}</strong>
                  <span>{mode === "online" ? "Online (Zoom)" : "In-person"}{doctor.consultationFee != null ? ` · ₹${doctor.consultationFee}` : ""}</span>
                </div>
              ) : (
                <div className="book-summary muted">Select a time slot to continue</div>
              )}

              {!user ? (
                <Link to="/login" className="btn">Log in to book</Link>
              ) : !isPatient ? (
                <span className="muted small">Only patients can book.</span>
              ) : (
                <button className="btn" disabled={!picked || booking || !!sameDay} onClick={handleBook}>
                  {booking ? "Booking..." : "Book your slot"}
                </button>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

export default DoctorProfile;

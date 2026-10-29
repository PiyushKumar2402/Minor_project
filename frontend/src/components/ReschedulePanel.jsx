import { useEffect, useMemo, useState } from "react";
import { getAvailabilityByDoctorId } from "../api/availability.js";
import { getSlotsForDate } from "../api/slots.js";
import { rescheduleAppointment } from "../api/reschedule.js";
import { nextDays, todayLocal, prettyDate, formatTime } from "../utils/date.js";

const errMsg = (e, f) => e?.response?.data?.message || e?.message || f;

// Pick a new day + time for an existing appointment (same doctor).
function ReschedulePanel({ appointment, token, onDone, onClose }) {
  const doctorId = appointment.doctor?._id || appointment.doctor;
  const [days] = useState(() => nextDays(14));
  const [availability, setAvailability] = useState(undefined);
  const [date, setDate] = useState("");
  const [slotData, setSlotData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getAvailabilityByDoctorId(doctorId).then(setAvailability).catch(() => setAvailability(null));
  }, [doctorId]);

  const offDays = useMemo(() => {
    const off = new Set();
    availability?.schedule?.forEach((s) => s.isOff && off.add(s.day));
    return off;
  }, [availability]);
  const isOff = (d) => !availability || offDays.has(d.weekdayLong);

  useEffect(() => {
    if (!availability || date) return;
    const first = days.find((d) => !isOff(d));
    if (first) setDate(first.iso);
  }, [availability]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!date) return;
    setSelected(null);
    setError("");
    setLoading(true);
    getSlotsForDate(doctorId, date)
      .then(setSlotData)
      .catch((e) => { setSlotData(null); setError(errMsg(e, "Could not load slots")); })
      .finally(() => setLoading(false));
  }, [doctorId, date]);

  const nowHHMM = new Date().toTimeString().slice(0, 5);
  const slots = (slotData?.slots || []).filter((s) => s._id !== (appointment.slot?._id || appointment.slot));
  const isPast = (s) => date === todayLocal() && s.startTime < nowHHMM;

  const confirm = async () => {
    if (!selected) return;
    setSaving(true);
    setError("");
    try {
      await rescheduleAppointment(appointment._id, selected._id, token);
      onDone();
    } catch (e) {
      setError(errMsg(e, "Could not reschedule"));
      getSlotsForDate(doctorId, date).then(setSlotData).catch(() => {});
      setSelected(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="resched-panel">
      <div className="resched-head">
        <strong>Move your appointment with Dr. {appointment.doctor?.name}</strong>
        <span className="muted small">Currently {prettyDate(appointment.date)} · {formatTime(appointment.startTime)}</span>
      </div>

      {availability === null && <p className="muted">This doctor has no availability set.</p>}

      <div className="date-strip">
        {days.map((d) => (
          <button key={d.iso} className={`date-chip ${date === d.iso ? "is-selected" : ""}`} disabled={isOff(d)} onClick={() => setDate(d.iso)}>
            <span>{d.weekday}</span><strong>{d.day}</strong><span>{d.month}</span>
          </button>
        ))}
      </div>

      {loading && <p className="muted">Loading slots...</p>}
      {!loading && slotData && slots.length === 0 && <p className="muted">No other slots on this day.</p>}
      <div className="slot-grid" style={{ marginTop: "0.6rem" }}>
        {slots.map((s) => (
          <button
            key={s._id}
            className={`slot-chip ${selected?._id === s._id ? "is-selected" : ""}`}
            disabled={s.status !== "available" || isPast(s)}
            onClick={() => setSelected(s)}
          >
            {formatTime(s.startTime)}
          </button>
        ))}
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="resched-actions">
        <button className="btn" disabled={!selected || saving} onClick={confirm}>
          {saving ? "Moving..." : selected ? `Move to ${prettyDate(date)}, ${formatTime(selected.startTime)}` : "Select a new time"}
        </button>
        <button className="btn btn-secondary" onClick={onClose}>Keep current time</button>
      </div>
    </div>
  );
}

export default ReschedulePanel;

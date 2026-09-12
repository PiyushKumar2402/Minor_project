import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { getMyAvailability, updateMyAvailability } from "../api/availability.js";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function DoctorAvailability() {
  const { user, token } = useAuth();
  const [schedule, setSchedule] = useState([]);
  const [slotDurationMinutes, setSlotDurationMinutes] = useState(15);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    getMyAvailability(token)
      .then((data) => {
        setSchedule(data.schedule);
        setSlotDurationMinutes(data.slotDurationMinutes);
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (user && user.role !== "doctor") {
    return (
      <div className="container">
        <p className="error-text">Only doctor accounts can manage availability.</p>
      </div>
    );
  }

  const updateDay = (day, field, value) => {
    setSchedule((prev) => prev.map((d) => (d.day === day ? { ...d, [field]: value } : d)));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);
    try {
      await updateMyAvailability({ schedule, slotDurationMinutes }, token);
      setMessage("Availability updated. Slots for upcoming dates will use these hours.");
    } catch (err) {
      setError(err.response?.data?.message || "Could not save availability");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="container">Loading...</div>;

  return (
    <div className="container">
      <div className="page-header">
        <h1>My Availability</h1>
      </div>
      <p className="subtitle">
        Set your weekly working hours. The system will automatically generate bookable time
        slots from these hours.
      </p>

      <form onSubmit={handleSave} className="card" style={{ maxWidth: 640 }}>
        <div className="form-group" style={{ maxWidth: 220 }}>
          <label>Slot duration (minutes)</label>
          <input
            type="number"
            min="5"
            step="5"
            value={slotDurationMinutes}
            onChange={(e) => setSlotDurationMinutes(Number(e.target.value))}
          />
        </div>

        <table className="data-table" style={{ marginTop: "1rem" }}>
          <thead>
            <tr>
              <th>Day</th>
              <th>Off</th>
              <th>Start</th>
              <th>End</th>
            </tr>
          </thead>
          <tbody>
            {DAYS.map((day) => {
              const entry = schedule.find((d) => d.day === day) || { day, isOff: true, startTime: "10:00", endTime: "14:00" };
              return (
                <tr key={day}>
                  <td>{day}</td>
                  <td>
                    <input
                      type="checkbox"
                      checked={entry.isOff}
                      onChange={(e) => updateDay(day, "isOff", e.target.checked)}
                    />
                  </td>
                  <td>
                    <input
                      type="time"
                      value={entry.startTime}
                      disabled={entry.isOff}
                      onChange={(e) => updateDay(day, "startTime", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="time"
                      value={entry.endTime}
                      disabled={entry.isOff}
                      onChange={(e) => updateDay(day, "endTime", e.target.value)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {error && <p className="error-text" style={{ marginTop: "0.8rem" }}>{error}</p>}
        {message && <p style={{ color: "var(--secondary)", marginTop: "0.8rem" }}>{message}</p>}

        <button type="submit" className="btn" style={{ marginTop: "1rem" }} disabled={saving}>
          {saving ? "Saving..." : "Save Availability"}
        </button>
      </form>
    </div>
  );
}

export default DoctorAvailability;

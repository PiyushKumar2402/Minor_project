import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getMyAppointments, cancelAppointment } from "../api/appointments.js";

const todayISO = () => new Date().toISOString().split("T")[0];

function MyAppointments() {
  const { user, token } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  const load = () => {
    setLoading(true);
    getMyAppointments(token)
      .then(setAppointments)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (token) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (user && user.role !== "patient") {
    return (
      <div className="container">
        <p className="error-text">Only patient accounts have appointments to view here.</p>
      </div>
    );
  }

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this appointment?")) return;
    setError("");
    setCancellingId(id);
    try {
      await cancelAppointment(id, token);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not cancel appointment");
    } finally {
      setCancellingId(null);
    }
  };

  const today = todayISO();
  const upcoming = appointments.filter((a) => a.status === "booked" && a.date >= today);
  const past = appointments.filter((a) => a.status !== "booked" || a.date < today);

  const renderRow = (appt) => (
    <tr key={appt._id}>
      <td>{appt.date}</td>
      <td>
        {appt.startTime} - {appt.endTime}
      </td>
      <td>
        Dr. {appt.doctor?.name}
        <br />
        <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>{appt.doctor?.specialization}</span>
      </td>
      <td>{appt.queueNumber}</td>
      <td style={{ textTransform: "capitalize" }}>{appt.status}</td>
      <td>
        {appt.status === "booked" && appt.date >= today && (
          <button
            className="btn btn-danger"
            onClick={() => handleCancel(appt._id)}
            disabled={cancellingId === appt._id}
          >
            {cancellingId === appt._id ? "Cancelling..." : "Cancel"}
          </button>
        )}
      </td>
    </tr>
  );

  return (
    <div className="container">
      <div className="page-header">
        <h1>My Appointments</h1>
      </div>
      <p className="subtitle">
        Looking to book a new one? <Link to="/doctors">Find a doctor</Link>.
      </p>

      {error && <p className="error-text">{error}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <h3>Upcoming</h3>
          {upcoming.length === 0 ? (
            <p style={{ color: "var(--muted)" }}>No upcoming appointments.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Doctor</th>
                  <th>Queue #</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>{upcoming.map(renderRow)}</tbody>
            </table>
          )}

          <h3 style={{ marginTop: "2rem" }}>Past & Cancelled</h3>
          {past.length === 0 ? (
            <p style={{ color: "var(--muted)" }}>Nothing here yet.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Doctor</th>
                  <th>Queue #</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>{past.map(renderRow)}</tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}

export default MyAppointments;

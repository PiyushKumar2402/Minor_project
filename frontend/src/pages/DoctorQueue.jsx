import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { getTodayQueue, updateQueueStatus, callNextPatient } from "../api/queue.js";
import StatusBadge from "../components/StatusBadge.jsx";

const POLL_MS = 10000; // refresh every 10 seconds

function DoctorQueue() {
  const { user, token } = useAuth();
  const [queue, setQueue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [callingNext, setCallingNext] = useState(false);

  const load = () =>
    getTodayQueue(token)
      .then((data) => setQueue(data))
      .catch((err) => setError(err.response?.data?.message || "Could not load today's queue"))
      .finally(() => setLoading(false));

  useEffect(() => {
    if (!token) return;
    load();
    const timer = setInterval(load, POLL_MS);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (user && user.role !== "doctor") {
    return (
      <div className="container">
        <p className="error-text">Only doctor accounts can manage the queue.</p>
      </div>
    );
  }

  const changeStatus = async (appointmentId, status) => {
    setError("");
    setBusyId(appointmentId);
    try {
      await updateQueueStatus(appointmentId, status, token);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not update status");
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const handleCallNext = async () => {
    setError("");
    setCallingNext(true);
    try {
      await callNextPatient(token);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not call the next patient");
    } finally {
      setCallingNext(false);
    }
  };

  if (loading) return <div className="container">Loading...</div>;

  const counts = queue?.counts || {};
  const appointments = queue?.appointments || [];

  const actionsFor = (appt) => {
    const busy = busyId === appt._id;
    const small = { padding: "0.3rem 0.7rem", fontSize: "0.8rem" };
    switch (appt.status) {
      case "booked":
        return (
          <>
            <button className="btn btn-secondary" style={small} disabled={busy} onClick={() => changeStatus(appt._id, "waiting")}>
              Check in
            </button>
            <button className="btn btn-danger" style={small} disabled={busy} onClick={() => changeStatus(appt._id, "no-show")}>
              No-show
            </button>
          </>
        );
      case "waiting":
        return (
          <>
            <button className="btn" style={small} disabled={busy} onClick={() => changeStatus(appt._id, "in-consultation")}>
              Start
            </button>
            <button className="btn btn-danger" style={small} disabled={busy} onClick={() => changeStatus(appt._id, "no-show")}>
              No-show
            </button>
          </>
        );
      case "in-consultation":
        return (
          <button className="btn" style={small} disabled={busy} onClick={() => changeStatus(appt._id, "completed")}>
            Complete
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>Today's Queue</h1>
        <button className="btn" onClick={handleCallNext} disabled={callingNext || counts.waiting === 0}>
          {callingNext ? "Calling..." : "Call next patient"}
        </button>
      </div>
      <p className="subtitle">
        {queue?.date} &middot; refreshes automatically &middot; waiting patients are called in appointment-time order.
      </p>

      {error && <p className="error-text">{error}</p>}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
        <div className="card" style={{ flex: "1 1 200px" }}>
          <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Now serving</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "var(--primary)" }}>
            {queue?.nowServing ? queue.nowServing.queueNumber : "—"}
          </div>
          {queue?.nowServing && (
            <div style={{ fontSize: "0.85rem" }}>{queue.nowServing.patient?.name}</div>
          )}
        </div>
        {[
          ["Booked", counts.booked],
          ["Waiting", counts.waiting],
          ["Completed", counts.completed],
          ["No-show", counts["no-show"]],
        ].map(([label, value]) => (
          <div className="card" key={label} style={{ flex: "1 1 110px", textAlign: "center" }}>
            <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>{label}</div>
            <div style={{ fontSize: "1.8rem", fontWeight: 700 }}>{value || 0}</div>
          </div>
        ))}
      </div>

      {appointments.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>No appointments scheduled for today.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Queue #</th>
              <th>Patient</th>
              <th>Type</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appt) => (
              <tr key={appt._id}>
                <td>{appt.startTime}</td>
                <td>{appt.queueNumber}</td>
                <td>
                  {appt.patient?.name}
                  {appt.patient?.phone && (
                    <>
                      <br />
                      <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>{appt.patient.phone}</span>
                    </>
                  )}
                </td>
                <td>{appt.mode === "online" ? "Online" : "In-Person"}</td>
                <td>
                  <StatusBadge status={appt.status} />
                </td>
                <td>
                  <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>{actionsFor(appt)}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default DoctorQueue;

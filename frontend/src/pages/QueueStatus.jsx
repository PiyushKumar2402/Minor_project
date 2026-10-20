import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getQueueStatus, checkIn } from "../api/queue.js";
import StatusBadge from "../components/StatusBadge.jsx";

const POLL_MS = 10000; // refresh every 10 seconds

function BigStat({ label, value, hint }) {
  return (
    <div className="card" style={{ flex: "1 1 170px", textAlign: "center" }}>
      <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>{label}</div>
      <div style={{ fontSize: "2.4rem", fontWeight: 700, color: "var(--primary)", margin: "0.3rem 0" }}>{value}</div>
      {hint && <div style={{ color: "var(--muted)", fontSize: "0.8rem" }}>{hint}</div>}
    </div>
  );
}

function QueueStatus() {
  const { id } = useParams();
  const { user, token } = useAuth();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [checkingIn, setCheckingIn] = useState(false);

  const load = () =>
    getQueueStatus(id, token)
      .then((data) => {
        setInfo(data);
        setError("");
      })
      .catch((err) => setError(err.response?.data?.message || "Could not load queue status"))
      .finally(() => setLoading(false));

  useEffect(() => {
    if (!token) return;
    load();
    const timer = setInterval(load, POLL_MS);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token]);

  const handleCheckIn = async () => {
    setActionMessage("");
    setError("");
    setCheckingIn(true);
    try {
      const result = await checkIn(id, token);
      setActionMessage(result.message);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not check in");
    } finally {
      setCheckingIn(false);
    }
  };

  if (user && user.role !== "patient") {
    return (
      <div className="container">
        <p className="error-text">Only patients can track their own queue position.</p>
      </div>
    );
  }

  if (loading) return <div className="container">Loading...</div>;

  if (!info) {
    return (
      <div className="container">
        <p className="error-text">{error || "Appointment not found"}</p>
        <Link to="/my-appointments">Back to My Appointments</Link>
      </div>
    );
  }

  const { status, isToday } = info;
  const isActive = ["booked", "waiting", "in-consultation"].includes(status);

  return (
    <div className="container">
      <Link to="/my-appointments">&larr; Back to My Appointments</Link>
      <div className="page-header" style={{ marginTop: "1rem" }}>
        <h1>Live Queue</h1>
        <StatusBadge status={status} />
      </div>
      <p className="subtitle">
        Dr. {info.doctor?.name} &middot; {info.date} &middot; {info.startTime} &ndash; {info.endTime} &middot;{" "}
        {info.mode === "online" ? "Online (Zoom)" : "In-Person"}
      </p>

      {error && <p className="error-text">{error}</p>}
      {actionMessage && <p style={{ color: "var(--secondary)", fontWeight: 600 }}>{actionMessage}</p>}

      {!isActive && (
        <div className="card" style={{ maxWidth: 520 }}>
          <p style={{ margin: 0 }}>
            {status === "completed" && "This consultation is complete. Thank you for visiting."}
            {status === "no-show" && "This appointment was marked as a no-show."}
            {status === "cancelled" && "This appointment was cancelled."}
          </p>
        </div>
      )}

      {isActive && !isToday && (
        <div className="card" style={{ maxWidth: 520 }}>
          <p style={{ margin: 0 }}>
            The live queue opens on the day of your appointment ({info.date}). Your queue number is{" "}
            <strong>{info.queueNumber}</strong>.
          </p>
        </div>
      )}

      {isActive && isToday && (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", maxWidth: 720 }}>
            <BigStat label="Your queue number" value={info.queueNumber} />
            <BigStat label="Now serving" value={info.nowServing || "—"} hint={info.nowServing ? "" : "Nobody inside yet"} />
            {status === "waiting" && (
              <BigStat
                label="Patients ahead of you"
                value={info.patientsAhead}
                hint={info.patientsAhead === 0 ? "You're next" : ""}
              />
            )}
          </div>

          {status === "booked" && (
            <div className="card" style={{ maxWidth: 520, marginTop: "1.25rem" }}>
              <p style={{ marginTop: 0 }}>
                {info.mode === "online"
                  ? "Ready to join? Tap below to join the waiting list, then open your Zoom link."
                  : "Arrived at the clinic? Tap below to join the waiting list."}
              </p>
              <button className="btn" onClick={handleCheckIn} disabled={checkingIn}>
                {checkingIn ? "Checking in..." : "I've arrived — check me in"}
              </button>
            </div>
          )}

          {status === "waiting" && (
            <p style={{ color: "var(--muted)", marginTop: "1.25rem" }}>
              You're in the waiting list. This page refreshes automatically.
            </p>
          )}

          {status === "in-consultation" && (
            <p style={{ color: "var(--secondary)", fontWeight: 600, marginTop: "1.25rem" }}>
              It's your turn. The doctor is seeing you now.
            </p>
          )}
        </>
      )}
    </div>
  );
}

export default QueueStatus;

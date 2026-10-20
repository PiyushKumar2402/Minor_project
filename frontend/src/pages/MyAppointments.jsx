import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getMyAppointments, cancelAppointment } from "../api/appointments.js";
import { todayLocal, prettyDate, formatTime } from "../utils/date.js";
import StatusBadge from "../components/StatusBadge.jsx";
import Icon from "../components/Icon.jsx";

const errMsg = (e, fallback) => e?.response?.data?.message || e?.message || fallback;

function MyAppointments() {
  const { user, token, loading: authLoading } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  const load = () =>
    getMyAppointments(token)
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .catch((e) => setError(errMsg(e, "Could not load appointments")))
      .finally(() => setLoading(false));

  useEffect(() => {
    if (token) load();
    else if (!authLoading) setLoading(false);
  }, [token, authLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCancel = async (a) => {
    if (!window.confirm("Cancel this appointment?")) return;
    setBusy(a._id);
    setError("");
    try {
      await cancelAppointment(a._id, token);
      await load();
    } catch (e) {
      setError(errMsg(e, "Could not cancel"));
      await load();
    } finally {
      setBusy("");
    }
  };

  if (authLoading) return <div className="container">Loading...</div>;
  if (!user) return <div className="container"><p className="error-text">Please <Link to="/login">log in</Link> to see your appointments.</p></div>;

  const today = todayLocal();
  const upcoming = items.filter((a) => a.date >= today && ["booked", "waiting", "in-consultation"].includes(a.status));
  const past = items.filter((a) => !upcoming.includes(a));

  const Card = ({ a }) => (
    <div className="appt-card">
      <div className="appt-date">
        <strong>{a.date.slice(8)}</strong>
        <span>{new Date(a.date + "T00:00").toLocaleDateString("en-US", { month: "short" })}</span>
      </div>
      <div className="appt-main">
        <div className="appt-title">
          <h3>Dr. {a.doctor?.name}</h3>
          <StatusBadge status={a.status} />
        </div>
        <div className="muted small">
          {a.doctor?.specialization} · {prettyDate(a.date)} · {formatTime(a.startTime)}
        </div>
        <div className="appt-tags">
          <span className="tag"><Icon name={a.mode === "online" ? "video" : "building"} size={14} /> {a.mode === "online" ? "Online" : `In-person${a.room ? ` · Room ${a.room}` : ""}`}</span>
          <span className="tag token">Queue {a.queueNumber}</span>
        </div>
      </div>
      <div className="appt-actions">
        {a.mode === "online" && a.meetingJoinUrl && ["booked", "waiting", "in-consultation"].includes(a.status) && (
          <a className="btn btn-sm" href={a.meetingJoinUrl} target="_blank" rel="noreferrer">Join Zoom</a>
        )}
        {a.date === today && ["booked", "waiting", "in-consultation"].includes(a.status) && (
          <Link className="btn btn-secondary btn-sm" to={`/queue/${a._id}`}>Track queue</Link>
        )}
        {a.status === "booked" && (
          <button className="btn btn-danger btn-sm" disabled={busy === a._id} onClick={() => handleCancel(a)}>
            {busy === a._id ? "Cancelling..." : "Cancel"}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="container">
      <div className="page-header">
        <h1>My appointments</h1>
        <p className="subtitle">One appointment per day. Cancel is available until you check in.</p>
      </div>
      {loading && <p className="muted">Loading...</p>}
      {error && <p className="error-text">{error}</p>}
      {!loading && items.length === 0 && (
        <div className="empty">No appointments yet. <Link to="/doctors">Find a doctor</Link></div>
      )}
      {upcoming.length > 0 && <h2 className="section-title">Upcoming</h2>}
      {upcoming.map((a) => <Card key={a._id} a={a} />)}
      {past.length > 0 && <h2 className="section-title">Past &amp; cancelled</h2>}
      {past.map((a) => <Card key={a._id} a={a} />)}
    </div>
  );
}

export default MyAppointments;

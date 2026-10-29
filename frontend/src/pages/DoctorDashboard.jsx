import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getDoctorAppointments } from "../api/appointments.js";
import { todayLocal, prettyDate, formatTime } from "../utils/date.js";
import StatusBadge from "../components/StatusBadge.jsx";
import Avatar from "../components/Avatar.jsx";
import Icon from "../components/Icon.jsx";
import "../styles/dashboard.css";

const LIVE = ["booked", "waiting", "in-consultation"];
const errMsg = (e, f) => e?.response?.data?.message || e?.message || f;

function DoctorDashboard() {
  const { user, token, loading: authLoading } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("today");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  const load = () =>
    getDoctorAppointments(token)
      .then((d) => { setItems(Array.isArray(d) ? d : []); setError(""); })
      .catch((e) => setError(errMsg(e, "Could not load appointments")))
      .finally(() => setLoading(false));

  useEffect(() => {
    if (!token) return;
    load();
    const t = setInterval(load, 30000); // light refresh
    return () => clearInterval(t);
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const today = todayLocal();

  const stats = useMemo(() => {
    const t = items.filter((a) => a.date === today);
    return {
      today: t.filter((a) => a.status !== "cancelled").length,
      waiting: t.filter((a) => a.status === "waiting").length,
      done: t.filter((a) => a.status === "completed").length,
      upcoming: items.filter((a) => a.date > today && a.status === "booked").length,
      online: t.filter((a) => a.mode === "online" && LIVE.includes(a.status)).length,
    };
  }, [items, today]);

  const lists = useMemo(() => ({
    today: items.filter((a) => a.date === today).sort((a, b) => a.startTime.localeCompare(b.startTime)),
    upcoming: items.filter((a) => a.date > today && LIVE.includes(a.status))
      .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime)),
    history: items.filter((a) => a.date < today || (a.date === today && !LIVE.includes(a.status)))
      .sort((a, b) => (b.date + b.startTime).localeCompare(a.date + a.startTime)),
  }), [items, today]);

  const shown = lists[tab].filter((a) => {
    const q = query.trim().toLowerCase();
    return (!q || a.patient?.name?.toLowerCase().includes(q)) && (status === "all" || a.status === status);
  });

  const nowServing = lists.today.find((a) => a.status === "in-consultation");
  const nextUp = lists.today.filter((a) => a.status === "waiting")[0];

  if (authLoading) return <div className="container">Loading...</div>;
  if (!user || user.role !== "doctor") {
    return <div className="container"><p className="error-text">This page is for doctors. <Link to="/login">Log in</Link></p></div>;
  }

  return (
    <div className="container">
      <div className="page-header dash-head">
        <div>
          <h1>Good day, Dr. {user.name}</h1>
          <p className="subtitle">{prettyDate(today)}</p>
        </div>
        <Link to="/doctor/queue" className="btn">Open live queue <Icon name="arrow" size={16} /></Link>
      </div>

      <div className="stat-grid">
        <div className="stat"><span>Today</span><strong>{stats.today}</strong></div>
        <div className="stat hot"><span>Waiting now</span><strong>{stats.waiting}</strong></div>
        <div className="stat"><span>Completed today</span><strong>{stats.done}</strong></div>
        <div className="stat"><span>Online today</span><strong>{stats.online}</strong></div>
        <div className="stat"><span>Upcoming</span><strong>{stats.upcoming}</strong></div>
      </div>

      {(nowServing || nextUp) && (
        <div className="card now-card">
          {nowServing && (
            <div><span className="muted small">In consultation</span>
              <h3>{nowServing.queueNumber} · {nowServing.patient?.name}</h3></div>
          )}
          {nextUp && (
            <div><span className="muted small">Next in line</span>
              <h3>{nextUp.queueNumber} · {nextUp.patient?.name} <span className="muted small">({formatTime(nextUp.startTime)})</span></h3></div>
          )}
        </div>
      )}

      <div className="dash-toolbar">
        <div className="segmented">
          {[["today", "Today"], ["upcoming", "Upcoming"], ["history", "History"]].map(([k, label]) => (
            <button key={k} className={tab === k ? "is-active" : ""} onClick={() => { setTab(k); setStatus("all"); }}>
              {label} ({lists[k].length})
            </button>
          ))}
        </div>
        <div className="search-box">
          <Icon name="search" size={16} />
          <input placeholder="Search patient" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search patient" />
        </div>
        {tab === "history" && (
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
            <option value="all">All statuses</option>
            <option value="completed">Completed</option>
            <option value="no-show">No-show</option>
            <option value="cancelled">Cancelled</option>
            <option value="booked">Never checked in</option>
          </select>
        )}
      </div>

      {loading && <p className="muted">Loading...</p>}
      {error && <p className="error-text">{error}</p>}
      {!loading && shown.length === 0 && <div className="empty">Nothing here.</div>}

      {shown.map((a) => (
        <div className="appt-card" key={a._id}>
          <Avatar name={a.patient?.name || "?"} size={44} />
          <div className="appt-main">
            <div className="appt-title">
              <h3>{a.patient?.name || "Patient"}</h3>
              <StatusBadge status={a.status} />
            </div>
            <div className="muted small">
              {prettyDate(a.date)} · {formatTime(a.startTime)}{a.patient?.phone ? ` · ${a.patient.phone}` : ""}
            </div>
            {a.reason && <div className="small" style={{ marginTop: "0.35rem" }}><strong>Reason:</strong> {a.reason}</div>}
            <div className="appt-tags">
              <span className="tag"><Icon name={a.mode === "online" ? "video" : "building"} size={14} /> {a.mode === "online" ? "Online" : "In-person"}</span>
              <span className="tag token">Queue {a.queueNumber}</span>
            </div>
          </div>
          <div className="appt-actions">
            {a.mode === "online" && a.meetingStartUrl && LIVE.includes(a.status) && (
              <a className="btn btn-sm" href={a.meetingStartUrl} target="_blank" rel="noreferrer">Start Zoom</a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default DoctorDashboard;

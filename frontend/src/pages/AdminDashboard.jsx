import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getAdminStats, getAppointmentRows, getReportPdf } from "../api/admin.js";
import { prettyDate } from "../utils/date.js";
import "../styles/dashboard.css";
import "../styles/admin.css";

const LABELS = {
  booked: "Booked", waiting: "Waiting", "in-consultation": "In consultation",
  completed: "Completed", "no-show": "No-show", cancelled: "Cancelled",
};
const errMsg = (e, f) => e?.response?.data?.message || e?.message || f;
const csvCell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

function AdminDashboard() {
  const { user, token, loading: authLoading } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [exporting, setExporting] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);

  useEffect(() => {
    if (!token) return;
    getAdminStats(token).then(setStats).catch((e) => setError(errMsg(e, "Could not load stats")));
  }, [token]);

  const downloadCsv = async () => {
    setExporting(true);
    setError("");
    try {
      const rows = await getAppointmentRows(token, from, to);
      const head = ["date", "startTime", "queueNumber", "status", "mode", "doctor", "specialization", "patient", "patientEmail"];
      const csv = [head.join(","), ...rows.map((r) => head.map((h) => csvCell(r[h])).join(","))].join("\n");
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `appointments${from ? "_" + from : ""}${to ? "_to_" + to : ""}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(errMsg(e, "Could not export"));
    } finally {
      setExporting(false);
    }
  };

  const downloadPdf = async () => {
    setPdfBusy(true);
    setError("");
    try {
      const blob = await getReportPdf(token, from, to);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `clinic-report${from ? "_" + from : ""}${to ? "_to_" + to : ""}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      // the error body arrives as a Blob because of responseType: "blob"
      let msg = e?.message || "Could not build the report";
      try { msg = JSON.parse(await e.response.data.text()).message || msg; } catch { /* keep default */ }
      setError(msg);
    } finally {
      setPdfBusy(false);
    }
  };

  if (authLoading) return <div className="container">Loading...</div>;
  if (!user || user.role !== "admin") {
    return <div className="container"><p className="error-text">This page is for admins. <Link to="/login">Log in</Link></p></div>;
  }

  const t = stats?.totals;
  const maxDay = Math.max(1, ...(stats?.perDay || []).map((d) => d.total));
  const maxStatus = Math.max(1, ...Object.values(stats?.byStatus || {}));

  return (
    <div className="container">
      <div className="page-header dash-head">
        <div>
          <h1>Admin dashboard</h1>
          <p className="subtitle">{stats ? prettyDate(stats.today) : ""}</p>
        </div>
        <Link to="/admin/doctors" className="btn btn-secondary">Manage doctors</Link>
      </div>

      {error && <p className="error-text">{error}</p>}
      {!stats && !error && <p className="muted">Loading...</p>}

      {stats && (
        <>
          <div className="stat-grid">
            <div className="stat"><span>Appointments</span><strong>{t.appointments}</strong></div>
            <div className="stat hot"><span>Today</span><strong>{t.today}</strong></div>
            <div className="stat"><span>Doctors</span><strong>{t.doctors}</strong></div>
            <div className="stat"><span>Patients</span><strong>{t.patients}</strong></div>
            <div className="stat"><span>Attendance</span><strong>{t.attendanceRate == null ? "–" : `${t.attendanceRate}%`}</strong></div>
            <div className="stat"><span>Cancelled</span><strong>{t.cancellationRate == null ? "–" : `${t.cancellationRate}%`}</strong></div>
          </div>

          <div className="admin-grid">
            <div className="card chart-card">
              <h3>Appointments, last 14 days</h3>
              <div className="bars">
                {stats.perDay.map((d) => (
                  <div className="bar-col" key={d.date} title={`${d.date}: ${d.total}`}>
                    <span className="bar-val">{d.total || ""}</span>
                    <div className={`bar ${d.date === stats.today ? "today" : ""}`} style={{ height: `${(d.total / maxDay) * 100}%` }} />
                    <span>{d.date.slice(8)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card chart-card">
              <h3>By status</h3>
              {Object.entries(stats.byStatus).map(([s, n]) => (
                <div className={`hbar-row s-${s}`} key={s}>
                  <span>{LABELS[s]}</span>
                  <div className="hbar-track"><div className="hbar-fill" style={{ width: `${(n / maxStatus) * 100}%` }} /></div>
                  <strong>{n}</strong>
                </div>
              ))}
              <p className="muted small" style={{ marginBottom: 0 }}>
                Online {stats.byMode.online} · In-person {stats.byMode["in-person"]}
              </p>
            </div>
          </div>

          <div className="card table-wrap">
            <h3>Doctors</h3>
            <table className="data-table">
              <thead>
                <tr><th>Doctor</th><th>Specialty</th><th>Total</th><th>Completed</th><th>No-show</th><th>Cancelled</th></tr>
              </thead>
              <tbody>
                {stats.byDoctor.length === 0 && <tr><td colSpan="6" className="muted">No appointments yet.</td></tr>}
                {stats.byDoctor.map((d) => (
                  <tr key={d.doctorId}>
                    <td>Dr. {d.name}</td><td>{d.specialization}</td>
                    <td>{d.total}</td><td>{d.completed}</td><td>{d.noShow}</td><td>{d.cancelled}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card" style={{ marginTop: "1rem" }}>
            <h3>Export</h3>
            <p className="muted small">Download appointments as CSV (leave dates empty for everything). The PDF report has charts and the full list.</p>
            <div className="report-box">
              <label>From <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
              <label>To <input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
              <button className="btn" onClick={downloadCsv} disabled={exporting}>{exporting ? "Preparing..." : "Download CSV"}</button>
              <button className="btn btn-secondary" onClick={downloadPdf} disabled={pdfBusy}>{pdfBusy ? "Building PDF..." : "Download PDF report"}</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default AdminDashboard;

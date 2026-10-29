import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getEnquiries } from "../api/enquiries.js";

function AdminEnquiries() {
  const { user, token, loading: authLoading } = useAuth();
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    getEnquiries(token)
      .then(setRows)
      .catch((e) => setError(e?.response?.data?.message || "Could not load enquiries"))
      .finally(() => setLoading(false));
  }, [token]);

  if (authLoading) return <div className="container">Loading...</div>;
  if (!user || user.role !== "admin") {
    return <div className="container"><p className="error-text">This page is for admins. <Link to="/login">Log in</Link></p></div>;
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>Enquiries</h1>
        <p className="subtitle">Messages sent from the Contact Us page, newest first.</p>
      </div>
      {loading && <p className="muted">Loading...</p>}
      {error && <p className="error-text">{error}</p>}
      {!loading && !error && rows.length === 0 && <div className="empty">No enquiries yet.</div>}
      {rows.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead><tr><th>Received</th><th>Type</th><th>From</th><th>Contact</th><th>Message</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r._id}>
                  <td style={{ whiteSpace: "nowrap" }}>{new Date(r.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</td>
                  <td>{r.type}</td>
                  <td>{r.name}</td>
                  <td><a href={`mailto:${r.email}`}>{r.email}</a><br />{r.phone}</td>
                  <td style={{ maxWidth: 380, whiteSpace: "pre-wrap" }}>{r.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminEnquiries;

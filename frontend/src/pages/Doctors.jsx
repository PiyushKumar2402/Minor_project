import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getDoctors } from "../api/doctors.js";
import Avatar from "../components/Avatar.jsx";
import Icon from "../components/Icon.jsx";

function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [spec, setSpec] = useState("All");

  useEffect(() => {
    getDoctors()
      .then((data) => setDoctors(Array.isArray(data) ? data : data.doctors || []))
      .catch((e) => setError(e?.response?.data?.message || e.message || "Could not load doctors"))
      .finally(() => setLoading(false));
  }, []);

  const specs = useMemo(
    () => ["All", ...new Set(doctors.map((d) => d.specialization).filter(Boolean))],
    [doctors]
  );

  const shown = doctors.filter((d) => {
    const q = query.trim().toLowerCase();
    const matchText = !q || d.name?.toLowerCase().includes(q) || d.specialization?.toLowerCase().includes(q);
    return matchText && (spec === "All" || d.specialization === spec);
  });

  return (
    <div className="container">
      <div className="page-header">
        <h1>Find a doctor</h1>
        <p className="subtitle">Book a slot in a few clicks.</p>
      </div>

      <div className="search-box">
        <Icon name="search" size={18} />
        <input
          placeholder="Search by name or specialty"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search doctors"
        />
      </div>

      <div className="pill-row">
        {specs.map((s) => (
          <button key={s} className={`pill ${spec === s ? "is-active" : ""}`} onClick={() => setSpec(s)}>
            {s}
          </button>
        ))}
      </div>

      {loading && <p className="muted">Loading doctors...</p>}
      {error && <p className="error-text">{error}</p>}
      {!loading && !error && shown.length === 0 && <div className="empty">No doctors match your search.</div>}

      <div className="doctor-grid">
        {shown.map((d) => (
          <Link to={`/doctors/${d._id}`} key={d._id} className="doctor-card">
            <div className="doctor-card-top">
              <Avatar name={d.name} />
              <div>
                <h3>Dr. {d.name}</h3>
                <span className="specialization">{d.specialization}</span>
              </div>
            </div>
            {d.bio && <p className="doctor-bio">{d.bio}</p>}
            <div className="doctor-meta">
              {d.experienceYears != null && <span>{d.experienceYears} yrs experience</span>}
              {d.consultationFee != null && <span className="fee">₹{d.consultationFee}</span>}
            </div>
            <span className="card-cta">View slots <Icon name="arrow" size={15} /></span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Doctors;

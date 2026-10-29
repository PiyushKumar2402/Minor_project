import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getDoctors } from "../api/doctors.js";
import DoctorCard from "../components/DoctorCard.jsx";
import Icon from "../components/Icon.jsx";
import "../styles/home.css";

function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [params] = useSearchParams();
  const [spec, setSpec] = useState(params.get("spec") || "All");
  useEffect(() => { setSpec(params.get("spec") || "All"); }, [params]);

  useEffect(() => {
    getDoctors()
      .then((data) => setDoctors(Array.isArray(data) ? data : data.doctors || []))
      .catch((e) => setError(e?.response?.data?.message || e.message || "Could not load doctors"))
      .finally(() => setLoading(false));
  }, []);

  const specs = useMemo(() => ["All", ...new Set(doctors.map((d) => d.specialization).filter(Boolean))], [doctors]);

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
        <input placeholder="Search by name or specialty" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search doctors" />
      </div>

      <div className="pill-row">
        {specs.map((s) => (
          <button key={s} className={`pill ${spec === s ? "is-active" : ""}`} onClick={() => setSpec(s)}>{s}</button>
        ))}
      </div>

      {loading && <p className="muted">Loading doctors...</p>}
      {error && <p className="error-text">{error}</p>}
      {!loading && !error && shown.length === 0 && <div className="empty">No doctors match your search.</div>}

      <div className="dgrid">
        {shown.map((d) => <DoctorCard key={d._id} doctor={d} />)}
      </div>
    </div>
  );
}

export default Doctors;

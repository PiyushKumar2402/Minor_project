import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDoctors, getSpecializations } from "../api/doctors.js";

function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [selectedSpecialization, setSelectedSpecialization] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSpecializations().then(setSpecializations).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    getDoctors(selectedSpecialization)
      .then(setDoctors)
      .finally(() => setLoading(false));
  }, [selectedSpecialization]);

  return (
    <div className="container">
      <div className="page-header">
        <h1>Find a Doctor</h1>
      </div>
      <p className="subtitle">Browse doctors and filter by specialization.</p>

      <div className="form-group" style={{ maxWidth: 280 }}>
        <label>Filter by specialization</label>
        <select value={selectedSpecialization} onChange={(e) => setSelectedSpecialization(e.target.value)}>
          <option value="">All specializations</option>
          {specializations.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Loading doctors...</p>
      ) : doctors.length === 0 ? (
        <p>No doctors found for this filter yet.</p>
      ) : (
        <div className="doctor-grid">
          {doctors.map((doc) => (
            <div className="doctor-card" key={doc._id}>
              <h3>{doc.name}</h3>
              <p className="specialization">{doc.specialization}</p>
              {doc.experienceYears > 0 && <p>{doc.experienceYears} years experience</p>}
              {doc.consultationFee > 0 && <p>Consultation fee: ₹{doc.consultationFee}</p>}
              <Link to={`/doctors/${doc._id}`} className="btn" style={{ marginTop: "0.6rem" }}>
                View Profile
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Doctors;

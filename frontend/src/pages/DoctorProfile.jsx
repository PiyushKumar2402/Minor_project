import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getDoctorById } from "../api/doctors.js";

function DoctorProfile() {
  const { id } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getDoctorById(id)
      .then(setDoctor)
      .catch(() => setError("Doctor not found"));
  }, [id]);

  if (error) {
    return (
      <div className="container">
        <p className="error-text">{error}</p>
        <Link to="/doctors">Back to doctor list</Link>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="container">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <Link to="/doctors">&larr; Back to doctor list</Link>
      <div className="card" style={{ marginTop: "1rem", maxWidth: 560 }}>
        <h1 style={{ marginTop: 0 }}>{doctor.name}</h1>
        <p className="specialization" style={{ color: "var(--secondary)", fontWeight: 600 }}>
          {doctor.specialization}
        </p>
        {doctor.bio && <p>{doctor.bio}</p>}
        <p>
          <strong>Experience:</strong> {doctor.experienceYears || 0} years
        </p>
        <p>
          <strong>Consultation Fee:</strong> ₹{doctor.consultationFee || 0}
        </p>
        <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
          Booking is enabled once appointment scheduling (Stage 5) is live.
        </p>
      </div>
    </div>
  );
}

export default DoctorProfile;

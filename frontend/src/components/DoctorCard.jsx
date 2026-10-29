import { Link } from "react-router-dom";
import DoctorPhoto from "./DoctorPhoto.jsx";

function DoctorCard({ doctor }) {
  return (
    <article className="dcard">
      <DoctorPhoto doctor={doctor} />
      <h3>Dr. {doctor.name}</h3>
      <div className="dcard-spec">{doctor.specialization}</div>
      <div className="dcard-meta">
        {doctor.experienceYears != null && <span>{doctor.experienceYears} years experience</span>}
        {doctor.consultationFee != null && <span>Fee ₹{doctor.consultationFee}</span>}
      </div>
      <Link to={`/doctors/${doctor._id}`} className="btn dcard-btn">Book an Appointment</Link>
      <Link to={`/doctors/${doctor._id}`} className="dcard-link">View profile</Link>
    </article>
  );
}

export default DoctorCard;

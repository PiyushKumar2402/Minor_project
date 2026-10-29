import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Avatar from "./Avatar.jsx";
import useSpecialities from "../hooks/useSpecialities.js";
import { CLINIC } from "../config/clinic.js";

const Chevron = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
);

// Close the hover menu after choosing something
const closeMenu = () => document.activeElement?.blur?.();

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const specialities = useSpecialities(pathname);

  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <header className="site-header">
      <div className="utility">
        <div className="utility-in">
          <span>Helpline <a href={`tel:${CLINIC.helpline}`}>{CLINIC.helpline}</a></span>
          <span className="sep" />
          <span>Emergency <a href={`tel:${CLINIC.emergency}`}>{CLINIC.emergency}</a></span>
        </div>
      </div>

      <nav className="mainnav">
        <Link to="/" className="brand">
          {CLINIC.name}
          <small>{CLINIC.tagline}</small>
        </Link>

        <ul className="menu">
          <li className="has-drop">
            <button type="button" className="menu-btn">Speciality <Chevron /></button>
            <div className="drop">
              {specialities.length === 0 && <span className="drop-empty">No specialities yet</span>}
              {specialities.map((s) => (
                <Link key={s.name} to={`/doctors?spec=${encodeURIComponent(s.name)}`} onClick={closeMenu}>{s.name}</Link>
              ))}
            </div>
          </li>
          <li className="has-drop">
            <button type="button" className="menu-btn">Services <Chevron /></button>
            <div className="drop">
              <Link to="/doctors" onClick={closeMenu}>Book an Appointment</Link>
            </div>
          </li>
          <li><NavLink to="/reviews">Reviews</NavLink></li>
          <li><NavLink to="/contact">Contact Us</NavLink></li>

          {user?.role === "patient" && <li><NavLink to="/my-appointments">My appointments</NavLink></li>}
          {user?.role === "doctor" && (
            <>
              <li><NavLink to="/doctor/dashboard">Dashboard</NavLink></li>
              <li><NavLink to="/doctor/queue">Today's queue</NavLink></li>
              <li><NavLink to="/my-availability">Availability</NavLink></li>
            </>
          )}
          {user?.role === "admin" && (
            <>
              <li><NavLink to="/admin/dashboard">Dashboard</NavLink></li>
              <li><NavLink to="/admin/doctors">Doctors</NavLink></li>
              <li><NavLink to="/admin/enquiries">Enquiries</NavLink></li>
              <li><NavLink to="/admin/photos">Photos</NavLink></li>
            </>
          )}
        </ul>

        <div className="nav-actions">
          {user ? (
            <>
              {user.role === "doctor" && <Avatar name={user.name} size={38} doctorId={user._id || user.id} />}
              <span className="who">{user.name}<em>{user.role}</em></span>
              <button className="btn btn-secondary btn-sm" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary btn-sm">Login</Link>
              <Link to="/register" className="btn btn-sm">Register</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

export default Navbar;

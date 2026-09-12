import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <Link to="/" className="brand">
        Doctor Appointment System
      </Link>
      <div className="nav-links">
        <Link to="/doctors">Find a Doctor</Link>
        {user?.role === "admin" && <Link to="/admin/doctors">Manage Doctors</Link>}
        {user?.role === "doctor" && <Link to="/my-availability">My Availability</Link>}
        {user ? (
          <>
            <span className="role-badge">{user.role}</span>
            <button onClick={logout} className="btn btn-secondary" style={{ padding: "0.3rem 0.8rem" }}>
              Log Out
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Log In</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;

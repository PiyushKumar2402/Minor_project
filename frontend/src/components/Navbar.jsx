import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Icon from "./Icon.jsx";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="navbar">
      <Link to="/" className="brand">
        <span className="brand-mark"><Icon name="pulse" size={18} /></span>
        MediQueue
      </Link>

      <div className="nav-links">
        <NavLink to="/doctors">Find doctors</NavLink>
        {user?.role === "patient" && <NavLink to="/my-appointments">My appointments</NavLink>}
        {user?.role === "doctor" && (
          <>
            <NavLink to="/doctor/queue">Today's queue</NavLink>
            <NavLink to="/my-availability">My availability</NavLink>
          </>
        )}
        {user?.role === "admin" && <NavLink to="/admin/doctors">Manage doctors</NavLink>}

        {user ? (
          <>
            <span className="user-chip">
              <Icon name="user" size={15} />
              {user.name}
              <span className="role-badge">{user.role}</span>
            </span>
            <button className="btn btn-secondary btn-sm" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <NavLink to="/login">Login</NavLink>
            <Link to="/register" className="btn btn-sm">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;

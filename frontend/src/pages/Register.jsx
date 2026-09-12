import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../api/auth.js";
import { useAuth } from "../context/AuthContext.jsx";

function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const data = await registerUser(form);
      login(data);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="container">
      <div className="card form-card">
        <h2 style={{ marginTop: 0 }}>Create a Patient Account</h2>
        <p className="subtitle" style={{ marginTop: 0, fontSize: "0.85rem" }}>
          Doctor accounts are created by the clinic admin — if you're a doctor, ask
          your admin to set up your account.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full name</label>
            <input name="name" value={form.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Password (min 6 characters)</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
            />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="btn" style={{ width: "100%" }}>
            Register
          </button>
        </form>
        <p style={{ marginTop: "1rem", fontSize: "0.9rem" }}>
          Already have an account? <Link to="/login">Log In</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;

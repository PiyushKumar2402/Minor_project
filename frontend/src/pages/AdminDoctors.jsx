import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { getDoctors, createDoctor, updateDoctor, deleteDoctor } from "../api/doctors.js";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  specialization: "",
  bio: "",
  experienceYears: 0,
  consultationFee: 0,
  phone: "",
};

function AdminDoctors() {
  const { user, token } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadDoctors = () => {
    setLoading(true);
    getDoctors()
      .then(setDoctors)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  if (user && user.role !== "admin") {
    return (
      <div className="container">
        <p className="error-text">You do not have permission to view this page.</p>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (editingId) {
        // Password isn't editable here on purpose — keep updates to profile fields
        const { password, email, ...editableFields } = form;
        await updateDoctor(editingId, editableFields, token);
      } else {
        await createDoctor(form, token);
      }
      resetForm();
      loadDoctors();
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  };

  const handleEdit = (doctor) => {
    setEditingId(doctor._id);
    setForm({
      name: doctor.name,
      email: doctor.email,
      password: "",
      specialization: doctor.specialization || "",
      bio: doctor.bio || "",
      experienceYears: doctor.experienceYears || 0,
      consultationFee: doctor.consultationFee || 0,
      phone: doctor.phone || "",
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this doctor? This cannot be undone.")) return;
    try {
      await deleteDoctor(id, token);
      loadDoctors();
    } catch (err) {
      setError(err.response?.data?.message || "Could not remove doctor");
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>Manage Doctors</h1>
      </div>
      <p className="subtitle">Add new doctors, update their details, or remove them.</p>

      <div className="card" style={{ maxWidth: 520, marginBottom: "2rem" }}>
        <h3 style={{ marginTop: 0 }}>{editingId ? "Edit Doctor" : "Add New Doctor"}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full name</label>
            <input name="name" value={form.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              disabled={!!editingId}
            />
          </div>
          {!editingId && (
            <div className="form-group">
              <label>Temporary password</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
              />
            </div>
          )}
          <div className="form-group">
            <label>Specialization</label>
            <input name="specialization" value={form.specialization} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Bio</label>
            <textarea name="bio" value={form.bio} onChange={handleChange} rows={3} />
          </div>
          <div className="form-group">
            <label>Experience (years)</label>
            <input
              name="experienceYears"
              type="number"
              min="0"
              value={form.experienceYears}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Consultation fee (₹)</label>
            <input
              name="consultationFee"
              type="number"
              min="0"
              value={form.consultationFee}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input name="phone" value={form.phone} onChange={handleChange} />
          </div>

          {error && <p className="error-text">{error}</p>}

          <div style={{ display: "flex", gap: "0.6rem" }}>
            <button type="submit" className="btn">
              {editingId ? "Save Changes" : "Add Doctor"}
            </button>
            {editingId && (
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <h3>All Doctors</h3>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Specialization</th>
              <th>Email</th>
              <th>Experience</th>
              <th>Fee</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {doctors.map((doc) => (
              <tr key={doc._id}>
                <td>{doc.name}</td>
                <td>{doc.specialization}</td>
                <td>{doc.email}</td>
                <td>{doc.experienceYears || 0} yrs</td>
                <td>₹{doc.consultationFee || 0}</td>
                <td style={{ display: "flex", gap: "0.4rem" }}>
                  <button className="btn btn-secondary" onClick={() => handleEdit(doc)}>
                    Edit
                  </button>
                  <button className="btn btn-danger" onClick={() => handleDelete(doc._id)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdminDoctors;

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getDoctors } from "../api/doctors.js";
import { uploadPhoto, removePhoto } from "../api/photos.js";
import Avatar from "../components/Avatar.jsx";

// Shrinks the chosen picture to a 480x480 centred JPEG so it stays small (about 40 KB)
const shrink = (file) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const size = 480;
      const side = Math.min(img.width, img.height);
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = size;
      canvas.getContext("2d").drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => reject(new Error("That file is not a readable image."));
    img.src = url;
  });

function AdminPhotos() {
  const { user, token, loading } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [versions, setVersions] = useState({});
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    getDoctors().then((d) => setDoctors(Array.isArray(d) ? d : d.doctors || [])).catch(() => setMsg("Could not load doctors"));
  }, []);

  const bump = (id) => setVersions((v) => ({ ...v, [id]: Date.now() }));

  const onPick = async (doctor, file) => {
    if (!file) return;
    setMsg(""); setBusy(doctor._id);
    try {
      await uploadPhoto(doctor._id, await shrink(file), token);
      bump(doctor._id);
      setMsg(`Photo saved for Dr. ${doctor.name}.`);
    } catch (e) {
      setMsg(e?.response?.data?.message || e.message || "Could not save the photo");
    } finally { setBusy(""); }
  };

  const onRemove = async (doctor) => {
    setBusy(doctor._id);
    try { await removePhoto(doctor._id, token); bump(doctor._id); setMsg(`Photo removed for Dr. ${doctor.name}.`); }
    catch { setMsg("Could not remove the photo"); }
    finally { setBusy(""); }
  };

  if (loading) return <div className="container">Loading...</div>;
  if (!user || user.role !== "admin") return <div className="container"><p className="error-text">This page is for admins. <Link to="/login">Log in</Link></p></div>;

  return (
    <div className="container narrow-wide">
      <div className="page-header">
        <h1>Doctor photos</h1>
        <p className="subtitle">Choose a clear, front-facing photo. It is cropped to a square automatically.</p>
      </div>
      {msg && <div className="notice ok" style={{ marginTop: 0 }}>{msg}</div>}
      {doctors.length === 0 && <div className="empty">No doctors yet.</div>}
      {doctors.map((d) => (
        <div className="appt-card" key={d._id}>
          <Avatar name={d.name} doctorId={d._id} version={versions[d._id]} size={64} />
          <div className="appt-main">
            <h3 style={{ margin: 0 }}>Dr. {d.name}</h3>
            <div className="muted small">{d.specialization}</div>
          </div>
          <div className="appt-actions">
            <label className="btn btn-sm" style={{ cursor: "pointer" }}>
              {busy === d._id ? "Working..." : "Upload photo"}
              <input type="file" accept="image/jpeg,image/png,image/webp" hidden disabled={busy === d._id} onChange={(e) => { onPick(d, e.target.files[0]); e.target.value = ""; }} />
            </label>
            <button className="btn btn-secondary btn-sm" disabled={busy === d._id} onClick={() => onRemove(d)}>Remove</button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default AdminPhotos;

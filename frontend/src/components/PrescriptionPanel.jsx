import { useEffect, useState } from "react";
import { getPrescription, savePrescription } from "../api/prescriptions.js";
import "../styles/prescription.css";

const emptyMed = () => ({ name: "", dosage: "", frequency: "", duration: "" });
const errMsg = (e, f) => e?.response?.data?.message || e?.message || f;

// Doctor's form: diagnosis, medicines, advice, follow-up. Saving makes the PDF available to the patient.
function PrescriptionPanel({ appointment, token, onClose, onSaved }) {
  const [diagnosis, setDiagnosis] = useState("");
  const [medicines, setMedicines] = useState([emptyMed()]);
  const [advice, setAdvice] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [existing, setExisting] = useState(false);

  useEffect(() => {
    let alive = true;
    getPrescription(appointment._id, token)
      .then((rx) => {
        if (!alive) return;
        setExisting(true);
        setDiagnosis(rx.diagnosis || "");
        setMedicines(rx.medicines?.length ? rx.medicines.map((m) => ({ ...emptyMed(), ...m })) : [emptyMed()]);
        setAdvice(rx.advice || "");
        setFollowUpDate(rx.followUpDate || "");
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [appointment._id, token]);

  const setMed = (i, key, value) => setMedicines((list) => list.map((m, j) => (j === i ? { ...m, [key]: value } : m)));
  const addMed = () => setMedicines((list) => (list.length < 15 ? [...list, emptyMed()] : list));
  const removeMed = (i) => setMedicines((list) => (list.length > 1 ? list.filter((_, j) => j !== i) : list));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setDone("");
    setSaving(true);
    try {
      const res = await savePrescription(appointment._id, { diagnosis, medicines, advice, followUpDate }, token);
      setDone(res.message);
      setExisting(true);
      onSaved && onSaved(appointment._id);
    } catch (err) {
      setError(errMsg(err, "Could not save the prescription"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="rx-panel muted">Loading...</div>;

  return (
    <form className="rx-panel" onSubmit={submit}>
      <div className="rx-head">
        <h3>Prescription for {appointment.patient?.name}</h3>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>
      </div>

      <label className="rx-label">Diagnosis
        <input value={diagnosis} maxLength={300} onChange={(e) => setDiagnosis(e.target.value)} placeholder="e.g. Viral fever" required />
      </label>

      <div className="rx-label">Medicines</div>
      {medicines.map((m, i) => (
        <div className="rx-med" key={i}>
          <input className="rx-name" placeholder="Medicine name and strength" value={m.name} maxLength={100} onChange={(e) => setMed(i, "name", e.target.value)} aria-label={`Medicine ${i + 1} name`} />
          <input placeholder="Dosage (1 tablet)" value={m.dosage} maxLength={60} onChange={(e) => setMed(i, "dosage", e.target.value)} aria-label="Dosage" />
          <input placeholder="How often (twice a day)" value={m.frequency} maxLength={60} onChange={(e) => setMed(i, "frequency", e.target.value)} aria-label="Frequency" />
          <input placeholder="For how long (5 days)" value={m.duration} maxLength={60} onChange={(e) => setMed(i, "duration", e.target.value)} aria-label="Duration" />
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => removeMed(i)} disabled={medicines.length === 1} aria-label="Remove medicine">Remove</button>
        </div>
      ))}
      <button type="button" className="btn btn-secondary btn-sm" onClick={addMed} disabled={medicines.length >= 15}>+ Add medicine</button>

      <label className="rx-label">Advice (optional)
        <textarea rows={3} value={advice} maxLength={1000} onChange={(e) => setAdvice(e.target.value)} placeholder="Rest, fluids, diet..." />
      </label>
      <label className="rx-label">Follow-up date (optional)
        <input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />
      </label>

      {error && <p className="error-text">{error}</p>}
      {done && <p className="rx-done">{done}</p>}
      <div className="rx-actions">
        <button className="btn" disabled={saving}>{saving ? "Saving..." : existing ? "Update prescription" : "Submit prescription"}</button>
      </div>
    </form>
  );
}

export default PrescriptionPanel;

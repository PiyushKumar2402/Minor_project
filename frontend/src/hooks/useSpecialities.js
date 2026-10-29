import { useEffect, useState } from "react";
import { getDoctors } from "../api/doctors.js";

// Specialities come from the doctors in the database, so the list grows
// automatically when the admin adds a doctor with a new speciality.
// Returns [{ name, count }] sorted by name. `refreshKey` re-fetches when it changes.
export default function useSpecialities(refreshKey = "") {
  const [list, setList] = useState([]);

  useEffect(() => {
    let alive = true;
    getDoctors()
      .then((data) => {
        const doctors = Array.isArray(data) ? data : data.doctors || [];
        const counts = {};
        doctors.forEach((d) => { if (d.specialization) counts[d.specialization] = (counts[d.specialization] || 0) + 1; });
        if (alive) setList(Object.keys(counts).sort().map((name) => ({ name, count: counts[name] })));
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [refreshKey]);

  return list;
}

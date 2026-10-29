import { useState } from "react";

// Square doctor photo (uploaded by the admin under Photos). Falls back to big initials.
function DoctorPhoto({ doctor }) {
  const [broken, setBroken] = useState(false);
  const name = doctor.name || "";
  const parts = name.replace(/^Dr\.?\s*/i, "").trim().split(/\s+/);
  const initials = ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "?";
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) % 360;

  if (!broken) {
    return (
      <div className="dphoto">
        <img src={`/api/photos/${doctor._id}`} alt={`Dr. ${name}`} onError={() => setBroken(true)} />
      </div>
    );
  }
  return (
    <div className="dphoto dphoto-fallback" style={{ background: `hsl(${hash} 40% 90%)`, color: `hsl(${hash} 50% 28%)` }}>
      {initials}
    </div>
  );
}

export default DoctorPhoto;

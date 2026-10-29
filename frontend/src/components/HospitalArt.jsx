import { useState } from "react";

// Put your own photo of the clinic or hospital at frontend/public/hospital.jpg.
// Until then, this drawing is shown.
function HospitalArt() {
  const [noPhoto, setNoPhoto] = useState(false);
  if (!noPhoto) return <img className="hospital-photo" src="/hospital.jpg" alt="Our clinic" onError={() => setNoPhoto(true)} />;
  return (
    <svg className="hospital-photo" viewBox="0 0 560 380" role="img" aria-label="Clinic building illustration">
      <rect width="560" height="380" fill="#e8eef8" />
      <rect y="300" width="560" height="80" fill="#cfd9ea" />
      <rect x="150" y="90" width="260" height="220" fill="#fff" stroke="#bccae2" />
      <rect x="150" y="90" width="260" height="34" fill="#1a4480" />
      <path d="M270 100h20v6h6v6h-6v6h-20v-6h-6v-6h6z" fill="#fff" />
      {[0, 1, 2, 3].map((c) => [0, 1].map((r) => (
        <rect key={`${c}${r}`} x={172 + c * 56} y={142 + r * 62} width="38" height="44" rx="4" fill="#dce6f5" />
      )))}
      <rect x="248" y="250" width="64" height="60" fill="#1a4480" />
      <rect x="258" y="260" width="20" height="50" fill="#a9bfe0" />
      <rect x="282" y="260" width="20" height="50" fill="#a9bfe0" />
    </svg>
  );
}

export default HospitalArt;

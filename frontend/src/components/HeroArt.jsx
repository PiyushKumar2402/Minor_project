import { useState } from "react";

// Put your own photo at frontend/public/hero.jpg and it is used automatically.
// Until then, this drawn illustration is shown.
function HeroArt() {
  const [noPhoto, setNoPhoto] = useState(false);
  if (!noPhoto) {
    return <img className="hero-photo" src="/hero.jpg" alt="" onError={() => setNoPhoto(true)} />;
  }
  return (
    <svg className="hero-art" viewBox="0 0 480 420" role="img" aria-label="Appointment calendar and live queue illustration">
      <rect width="480" height="420" rx="28" fill="#e8eef8" />
      <circle cx="390" cy="70" r="120" fill="#d6e1f3" />
      <circle cx="70" cy="360" r="90" fill="#dce6f5" />
      <path d="M356 40h30v30h30v30h-30v30h-30v-30h-30V70h30z" fill="#fff" opacity=".9" />
      <rect x="70" y="86" width="250" height="230" rx="18" fill="#fff" stroke="#c9d6ea" />
      <rect x="70" y="86" width="250" height="52" rx="18" fill="#1a4480" />
      <rect x="70" y="118" width="250" height="20" fill="#1a4480" />
      <circle cx="110" cy="112" r="6" fill="#fff" opacity=".7" />
      <circle cx="132" cy="112" r="6" fill="#fff" opacity=".7" />
      {[0, 1, 2, 3, 4].map((c) => [0, 1, 2].map((r) => (
        <rect key={`${c}${r}`} x={92 + c * 44} y={158 + r * 44} width="30" height="30" rx="8"
          fill={c === 2 && r === 1 ? "#1a4480" : "#eef2f9"} />
      )))}
      <path d="M96 296h40l14-24 20 40 16-28 12 12h86" fill="none" stroke="#d9a441" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default HeroArt;

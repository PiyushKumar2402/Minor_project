// Initials in a colour picked from the name, so each doctor looks consistent
function Avatar({ name = "", size = 56 }) {
  const parts = name.replace(/^Dr\.?\s*/i, "").trim().split(/\s+/);
  const initials = ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "?";
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) % 360;
  return (
    <span
      className="avatar"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: `hsl(${hash} 45% 92%)`,
        color: `hsl(${hash} 55% 28%)`,
      }}
    >
      {initials}
    </span>
  );
}

export default Avatar;

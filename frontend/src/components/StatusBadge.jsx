const STYLES = {
  booked: { label: "Booked", bg: "#e6f1fb", color: "#185a8d" },
  waiting: { label: "Waiting", bg: "#fff3d6", color: "#8a5a00" },
  "in-consultation": { label: "In consultation", bg: "#d6f5ec", color: "#0b6b52" },
  completed: { label: "Completed", bg: "#e8eceb", color: "#3d4a49" },
  "no-show": { label: "No-show", bg: "#fbe3e3", color: "#a02828" },
  cancelled: { label: "Cancelled", bg: "#eeeeee", color: "#666666" },
};

function StatusBadge({ status }) {
  const s = STYLES[status] || { label: status, bg: "#eeeeee", color: "#444444" };
  return (
    <span
      style={{
        display: "inline-block",
        background: s.bg,
        color: s.color,
        padding: "0.15rem 0.65rem",
        borderRadius: 999,
        fontSize: "0.78rem",
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {s.label}
    </span>
  );
}

export default StatusBadge;

// Today's date as YYYY-MM-DD in the browser's local time
export const todayLocal = () => new Intl.DateTimeFormat("en-CA").format(new Date());

const fmt = (d) => new Intl.DateTimeFormat("en-CA").format(d);

// Next `count` days starting today: [{ iso, weekday, day, month }]
export const nextDays = (count = 14) => {
  const out = [];
  for (let i = 0; i < count; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    out.push({
      iso: fmt(d),
      weekday: d.toLocaleDateString("en-US", { weekday: "short" }),
      weekdayLong: d.toLocaleDateString("en-US", { weekday: "long" }),
      day: d.getDate(),
      month: d.toLocaleDateString("en-US", { month: "short" }),
    });
  }
  return out;
};

// "2026-10-20" -> "Tue, 20 Oct 2026"
export const prettyDate = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// "13:45" -> "1:45 PM"
export const formatTime = (hhmm) => {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${suffix}`;
};

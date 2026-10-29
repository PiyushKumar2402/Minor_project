const STAR = "M12 2.5l2.9 6.2 6.8.8-5 4.7 1.3 6.7L12 17.5l-6 3.4 1.3-6.7-5-4.7 6.8-.8z";

// Display: <StarRating value={4.5} />   Input: <StarRating value={r} onChange={setR} />
function StarRating({ value = 0, onChange, size = 18 }) {
  return (
    <span className={`stars ${onChange ? "is-input" : ""}`} role={onChange ? "radiogroup" : "img"} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const star = (
          <svg width={size} height={size} viewBox="0 0 24 24" className={n <= Math.round(value) ? "on" : ""} aria-hidden="true">
            <path d={STAR} />
          </svg>
        );
        return onChange ? (
          <button type="button" key={n} onClick={() => onChange(n)} aria-label={`${n} star${n > 1 ? "s" : ""}`}>{star}</button>
        ) : (
          <span key={n}>{star}</span>
        );
      })}
    </span>
  );
}

export default StarRating;

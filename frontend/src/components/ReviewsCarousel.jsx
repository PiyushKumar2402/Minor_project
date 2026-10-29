import { useEffect, useRef, useState } from "react";
import StarRating from "./StarRating.jsx";

const perView = () => (window.innerWidth >= 980 ? 3 : window.innerWidth >= 620 ? 2 : 1);

// Slides on its own every 4.5s. Hovering, focusing or touching it pauses the sliding.
function ReviewsCarousel({ reviews }) {
  const [per, setPer] = useState(perView());
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchTimer = useRef(null);
  const [stopped, setStopped] = useState(false); // pause button
  const maxIndex = Math.max(0, reviews.length - per);

  useEffect(() => {
    const onResize = () => setPer(perView());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => { if (index > maxIndex) setIndex(0); }, [index, maxIndex]);

  useEffect(() => {
    if (paused || stopped || maxIndex === 0) return;
    const timer = setInterval(() => setIndex((i) => (i >= maxIndex ? 0 : i + 1)), 4500);
    return () => clearInterval(timer);
  }, [paused, stopped, maxIndex]);

  useEffect(() => () => clearTimeout(touchTimer.current), []);

  const go = (i) => setIndex(Math.min(Math.max(i, 0), maxIndex));
  const onTouch = () => {
    setPaused(true);
    clearTimeout(touchTimer.current);
    touchTimer.current = setTimeout(() => setPaused(false), 6000);
  };

  return (
    <div
      className="rv"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={onTouch}
    >
      <div className="rv-viewport">
        <div className="rv-track" style={{ transform: `translateX(-${index * (100 / per)}%)` }}>
          {reviews.map((r) => (
            <div className="rv-slide" key={r._id} style={{ flexBasis: `${100 / per}%` }}>
              <figure className="rv-card">
                <StarRating value={r.rating} size={17} />
                <blockquote>{r.comment}</blockquote>
                <figcaption>
                  <strong>{r.patientName}</strong>
                  {r.doctorName && <span>Visited {r.doctorName}</span>}
                </figcaption>
              </figure>
            </div>
          ))}
        </div>
      </div>

      {maxIndex > 0 && (
        <div className="rv-controls">
          <button type="button" aria-label="Previous reviews" onClick={() => go(index <= 0 ? maxIndex : index - 1)}>‹</button>
          <div className="rv-dots">
            {Array.from({ length: maxIndex + 1 }, (_, i) => (
              <button type="button" key={i} aria-label={`Go to slide ${i + 1}`} className={i === index ? "on" : ""} onClick={() => go(i)} />
            ))}
          </div>
          <button type="button" aria-label="Next reviews" onClick={() => go(index >= maxIndex ? 0 : index + 1)}>›</button>
          <button type="button" className="rv-toggle" aria-label={stopped ? "Play auto-sliding" : "Pause auto-sliding"} onClick={() => setStopped(!stopped)}>{stopped ? "\u25B6" : "\u275A\u275A"}</button>
          <span className="rv-state">{stopped ? "Stopped" : paused ? "Paused" : ""}</span>
        </div>
      )}
    </div>
  );
}

export default ReviewsCarousel;

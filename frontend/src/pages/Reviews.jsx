import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { getReviews, deleteReview } from "../api/reviews.js";
import StarRating from "../components/StarRating.jsx";
import { SAMPLE_REVIEWS, SHOW_SAMPLE_REVIEWS, MIN_REAL_REVIEWS } from "../config/content.js";

function Reviews() {
  const { user, token } = useAuth();
  const [loaded, setData] = useState(null);
  let data = loaded;
  const [error, setError] = useState("");

  const load = () => getReviews({ limit: 100 }).then(setData).catch(() => setError("Could not load reviews"));
  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    if (!window.confirm("Remove this review?")) return;
    try { await deleteReview(id, token); load(); } catch { setError("Could not remove the review"); }
  };

  const useSample = !!data && SHOW_SAMPLE_REVIEWS && data.summary.count < MIN_REAL_REVIEWS;
  if (useSample) {
    const avg = SAMPLE_REVIEWS.reduce((t, r) => t + r.rating, 0) / SAMPLE_REVIEWS.length;
    data = { summary: { count: SAMPLE_REVIEWS.length, average: avg }, reviews: SAMPLE_REVIEWS };
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>Patient reviews</h1>
        <p className="subtitle">Real feedback from patients after their visit.</p>
      </div>
      {error && <p className="error-text">{error}</p>}
      {!data && !error && <p className="muted">Loading...</p>}
      {data && data.summary.count === 0 && (
        <div className="empty">No reviews yet. After a completed visit, patients can rate it from My appointments.</div>
      )}
      {data && data.summary.count > 0 && (
        <>
          {useSample && <p className="sample-note">Sample reviews shown for demonstration. They are replaced by real patient reviews as they come in.</p>}
          <div className="rating-summary">
            <span className="rating-big">{data.summary.average.toFixed(1)}</span>
            <div>
              <StarRating value={data.summary.average} size={22} />
              <div className="muted small">{data.summary.count} {data.summary.count === 1 ? "review" : "reviews"}</div>
            </div>
          </div>
          <div className="review-grid">
            {data.reviews.map((r) => (
              <figure className="rv-card" key={r._id}>
                <StarRating value={r.rating} size={17} />
                <blockquote>{r.comment}</blockquote>
                <figcaption>
                  <strong>{r.patientName}</strong>
                  {r.doctorName && <span>Visited {r.doctorName}</span>}
                </figcaption>
                {user?.role === "admin" && !useSample && <button className="btn btn-danger btn-sm" onClick={() => remove(r._id)}>Remove</button>}
              </figure>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default Reviews;

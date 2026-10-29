import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getDoctors } from "../api/doctors.js";
import { getReviews, getPublicStats } from "../api/reviews.js";
import { CLINIC } from "../config/clinic.js";
import { ABOUT, FAQS, SAMPLE_REVIEWS, SHOW_SAMPLE_REVIEWS, MIN_REAL_REVIEWS } from "../config/content.js";
import HeroArt from "../components/HeroArt.jsx";
import HospitalArt from "../components/HospitalArt.jsx";
import Avatar from "../components/Avatar.jsx";
import DoctorCard from "../components/DoctorCard.jsx";
import StarRating from "../components/StarRating.jsx";
import ReviewsCarousel from "../components/ReviewsCarousel.jsx";
import "../styles/home.css";

const STAFF_LINKS = {
  admin: [
    { to: "/admin/dashboard", title: "Dashboard", text: "Totals, charts, attendance and the PDF or CSV report." },
    { to: "/admin/doctors", title: "Manage doctors", text: "Add, edit or remove doctor accounts." },
    { to: "/admin/photos", title: "Doctor photos", text: "Upload a profile photo for each doctor." },
    { to: "/admin/enquiries", title: "Enquiries", text: "Messages sent from the Contact Us page." },
    { to: "/reviews", title: "Reviews", text: "Read patient reviews and remove inappropriate ones." },
  ],
  doctor: [
    { to: "/doctor/dashboard", title: "Dashboard", text: "Today's numbers, upcoming visits and history." },
    { to: "/doctor/queue", title: "Today's queue", text: "Check in, call the next patient, complete." },
    { to: "/my-availability", title: "My availability", text: "Set your working days and hours." },
  ],
};

const hueOf = (name) => { let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
const placeholderAddress = /^your clinic/i.test(CLINIC.address || "");

function Home() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [stats, setStats] = useState(null);
  const [rv, setRv] = useState({ summary: { count: 0, average: null }, reviews: [] });
  const [pick, setPick] = useState("");

  useEffect(() => {
    getDoctors().then((d) => setDoctors(Array.isArray(d) ? d : d.doctors || [])).catch(() => {});
    getPublicStats().then(setStats).catch(() => {});
    getReviews({ limit: 12 }).then(setRv).catch(() => {});
  }, []);

  if (loading) return <div className="container">Loading...</div>;

  if (user && STAFF_LINKS[user.role]) {
    return (
      <div className="container">
        <div className="page-header">
          <span className="eyebrow">{user.role === "admin" ? "Admin console" : "Doctor workspace"}</span>
          {user.role === "doctor" && <Avatar name={user.name} size={84} doctorId={user._id || user.id} />}
          <h1>Welcome, {user.role === "doctor" ? `Dr. ${user.name}` : user.name}</h1>
        </div>
        <div className="staff-grid">
          {STAFF_LINKS[user.role].map((l) => (
            <Link key={l.to} to={l.to} className="staff-tile">
              <h3>{l.title}</h3><p>{l.text}</p><span>Open</span>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  // specialities come from the doctors in the database
  const counts = {};
  doctors.forEach((d) => { if (d.specialization) counts[d.specialization] = (counts[d.specialization] || 0) + 1; });
  const specialities = Object.keys(counts).sort().map((name) => ({ name, count: counts[name] }));

  // real reviews win as soon as there are enough of them
  const useSample = SHOW_SAMPLE_REVIEWS && rv.summary.count < MIN_REAL_REVIEWS;
  const view = useSample
    ? { summary: { count: SAMPLE_REVIEWS.length, average: SAMPLE_REVIEWS.reduce((t, r) => t + r.rating, 0) / SAMPLE_REVIEWS.length }, reviews: SAMPLE_REVIEWS }
    : rv;

  const go = (e) => {
    e.preventDefault();
    navigate(pick ? `/doctors?spec=${encodeURIComponent(pick)}` : "/doctors");
  };

  const mapQuery = encodeURIComponent(CLINIC.address || "");

  return (
    <>
      {/* hero */}
      <section className="home-hero">
        <div className="container hero-in">
          <div className="fade-up">
            <span className="eyebrow">Appointments and live queue</span>
            <h1>Care that respects your time.</h1>
            <p className="lead">
              {user ? `Welcome back, ${user.name}. ` : ""}
              Book a slot with a specialist, get your queue number, and follow your turn as it happens, in person or on video.
            </p>
            <form className="find-bar" onSubmit={go}>
              <select value={pick} onChange={(e) => setPick(e.target.value)} aria-label="Speciality">
                <option value="">All specialities</option>
                {specialities.map((s) => <option key={s.name}>{s.name}</option>)}
              </select>
              <button className="btn">Find a doctor</button>
            </form>
            {!user && <p className="muted small" style={{ marginTop: "0.9rem" }}>New here? <Link to="/register">Create a free account</Link> to book.</p>}
          </div>
          <div className="hero-visual fade-up d2"><HeroArt /></div>
        </div>
      </section>

      {/* about + numbers */}
      <section className="about">
        <div className="container about-in">
          <div>
            <h2>About {CLINIC.name}</h2>
            {ABOUT.map((p) => <p key={p}>{p}</p>)}
            <Link to="/contact" className="about-link">Contact us</Link>
          </div>
          {stats && (
            <div className="numgrid">
              <div><strong>{stats.doctors}</strong><span>Doctors</span></div>
              <div><strong>{stats.specialities}</strong><span>Specialities</span></div>
              <div><strong>{stats.appointments}</strong><span>Appointments booked</span></div>
              <div><strong>{stats.rating ? stats.rating.toFixed(1) : "New"}</strong><span>Patient rating</span></div>
            </div>
          )}
        </div>
      </section>

      {/* specialities */}
      {specialities.length > 0 && (
        <section className="container section">
          <h2>Our specialities</h2>
          <div className="spec-grid">
            {specialities.map((s) => {
              const h = hueOf(s.name);
              return (
                <Link key={s.name} to={`/doctors?spec=${encodeURIComponent(s.name)}`} className="spec-tile">
                  <span className="spec-mono" style={{ background: `hsl(${h} 50% 92%)`, color: `hsl(${h} 55% 28%)` }}>{s.name[0]}</span>
                  <span className="spec-text"><strong>{s.name}</strong><span>{s.count} {s.count === 1 ? "doctor" : "doctors"}</span></span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* doctors */}
      {doctors.length > 0 && (
        <section className="container section">
          <div className="section-head">
            <h2>Our doctors</h2>
            <Link to="/doctors" className="about-link">View all doctors</Link>
          </div>
          <div className="dgrid">
            {doctors.slice(0, 4).map((d) => <DoctorCard key={d._id} doctor={d} />)}
          </div>
        </section>
      )}

      {/* reviews */}
      <section className="container section">
        <div className="section-head">
          <h2>What patients say</h2>
          {view.summary.count > 0 && (
            <div className="rate">
              <StarRating value={view.summary.average} size={20} />
              <strong style={{ color: "var(--dark)" }}>{view.summary.average.toFixed(1)}</strong>
              <span>from {view.summary.count} {view.summary.count === 1 ? "review" : "reviews"}</span>
              {!useSample && <Link to="/reviews">See all</Link>}
            </div>
          )}
        </div>
        {view.reviews.length > 0 ? <ReviewsCarousel reviews={view.reviews} /> : (
          <div className="empty">No reviews yet. After a completed visit, patients can rate it from My appointments.</div>
        )}
        {useSample && <p className="sample-note">Sample reviews shown for demonstration. They are replaced by real patient reviews as they come in.</p>}
      </section>

      {/* FAQ */}
      <section className="container section faq-wrap">
        <h2>Frequently asked questions</h2>
        <div className="faq">
          {FAQS.map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* directions */}
      <section className="container section">
        <div className="dir-grid">
          <div className="dir-card">
            <h2>Get directions</h2>
            <p className="dir-line"><strong>Address</strong>{CLINIC.address}</p>
            <p className="dir-line"><strong>Phone</strong>{CLINIC.helpline}</p>
            <p className="dir-line"><strong>Hours</strong>{CLINIC.hours}</p>
            {!placeholderAddress && (
              <>
                <iframe
                  title="Map"
                  className="dir-map"
                  loading="lazy"
                  src={`https://maps.google.com/maps?q=${mapQuery}&output=embed`}
                />
                <a className="about-link" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}>Open in Maps</a>
              </>
            )}
          </div>
          <HospitalArt />
        </div>
      </section>
    </>
  );
}

export default Home;

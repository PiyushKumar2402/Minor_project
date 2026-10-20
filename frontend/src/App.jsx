import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import Navbar from "./components/Navbar.jsx";
import Icon from "./components/Icon.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Doctors from "./pages/Doctors.jsx";
import DoctorProfile from "./pages/DoctorProfile.jsx";
import AdminDoctors from "./pages/AdminDoctors.jsx";
import DoctorAvailability from "./pages/DoctorAvailability.jsx";
import MyAppointments from "./pages/MyAppointments.jsx";
import QueueStatus from "./pages/QueueStatus.jsx";
import DoctorQueue from "./pages/DoctorQueue.jsx";
import "./styles/global.css";

function Home() {
  const { user, loading } = useAuth();
  if (loading) return <div className="container">Loading...</div>;

  const cta =
    user?.role === "doctor" ? { to: "/doctor/queue", text: "Open today's queue" }
    : user?.role === "admin" ? { to: "/admin/doctors", text: "Manage doctors" }
    : { to: "/doctors", text: "Find a doctor" };

  return (
    <div className="container">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Online appointments · live queue</span>
          <h1>See your doctor without the waiting-room guesswork.</h1>
          <p>
            {user ? `Welcome back, ${user.name}. ` : ""}
            Pick a slot, get a queue number, and watch your turn come up in real time, in person or on video.
          </p>
          <div className="hero-actions">
            <Link to={cta.to} className="btn">{cta.text} <Icon name="arrow" size={16} /></Link>
            {!user && <Link to="/login" className="btn btn-secondary">Login</Link>}
          </div>
        </div>
        <div className="token-card" aria-hidden="true">
          <span className="token-label">Your queue number</span>
          <span className="token-number">A04</span>
          <div className="token-row"><Icon name="clock" size={16} /> Now serving A02</div>
          <div className="token-row"><Icon name="user" size={16} /> 1 patient ahead of you</div>
        </div>
      </section>

      <section className="feature-row">
        <div className="feature"><Icon name="calendar" size={22} /><h3>Pick your slot</h3><p>Choose a day and a time that suits you.</p></div>
        <div className="feature"><Icon name="video" size={22} /><h3>Visit your way</h3><p>Go in person or join by Zoom.</p></div>
        <div className="feature"><Icon name="pulse" size={22} /><h3>Track live</h3><p>See who is being served and how many are ahead.</p></div>
      </section>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/doctors" element={<Doctors />} />
          <Route path="/doctors/:id" element={<DoctorProfile />} />
          <Route path="/admin/doctors" element={<AdminDoctors />} />
          <Route path="/my-availability" element={<DoctorAvailability />} />
          <Route path="/my-appointments" element={<MyAppointments />} />
          <Route path="/queue/:id" element={<QueueStatus />} />
          <Route path="/doctor/queue" element={<DoctorQueue />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

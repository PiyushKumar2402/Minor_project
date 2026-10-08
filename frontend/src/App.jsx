import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import Navbar from "./components/Navbar.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Doctors from "./pages/Doctors.jsx";
import DoctorProfile from "./pages/DoctorProfile.jsx";
import AdminDoctors from "./pages/AdminDoctors.jsx";
import DoctorAvailability from "./pages/DoctorAvailability.jsx";
import MyAppointments from "./pages/MyAppointments.jsx";
import "./styles/global.css";

function Home() {
  const { user, loading } = useAuth();

  if (loading) return <div className="container">Loading...</div>;

  return (
    <div className="container">
      <div className="page-header">
        <h1>Doctor Appointment & Queue Management System</h1>
      </div>
      {user ? (
        <p className="subtitle">
          Welcome back, <strong>{user.name}</strong> ({user.role}).
        </p>
      ) : (
        <p className="subtitle">Log in or register to book an appointment.</p>
      )}
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
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

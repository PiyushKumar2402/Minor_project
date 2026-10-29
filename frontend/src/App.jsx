import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Doctors from "./pages/Doctors.jsx";
import DoctorProfile from "./pages/DoctorProfile.jsx";
import AdminDoctors from "./pages/AdminDoctors.jsx";
import DoctorAvailability from "./pages/DoctorAvailability.jsx";
import MyAppointments from "./pages/MyAppointments.jsx";
import QueueStatus from "./pages/QueueStatus.jsx";
import DoctorQueue from "./pages/DoctorQueue.jsx";
import DoctorDashboard from "./pages/DoctorDashboard.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import NotFound from "./pages/NotFound.jsx";
import Contact from "./pages/Contact.jsx";
import AdminEnquiries from "./pages/AdminEnquiries.jsx";
import Reviews from "./pages/Reviews.jsx";
import AdminPhotos from "./pages/AdminPhotos.jsx";
import "./styles/global.css";
import "./styles/theme.css";
import "./styles/extras.css";

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
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/doctors" element={<AdminDoctors />} />
          <Route path="/my-availability" element={<DoctorAvailability />} />
          <Route path="/my-appointments" element={<MyAppointments />} />
          <Route path="/queue/:id" element={<QueueStatus />} />
          <Route path="/doctor/queue" element={<DoctorQueue />} />
          <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/admin/enquiries" element={<AdminEnquiries />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/admin/photos" element={<AdminPhotos />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

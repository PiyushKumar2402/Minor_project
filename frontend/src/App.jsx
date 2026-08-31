import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";

function Home() {
  const { user, logout, loading } = useAuth();

  if (loading) return <p style={{ padding: "2rem" }}>Loading...</p>;

  return (
    <div style={{ fontFamily: "sans-serif", padding: "2rem" }}>
      <h1>Doctor Appointment & Queue Management System</h1>
      {user ? (
        <>
          <p>
            Logged in as <strong>{user.name}</strong> ({user.role})
          </p>
          <button onClick={logout}>Log Out</button>
        </>
      ) : (
        <p>
          <Link to="/login">Log In</Link> | <Link to="/register">Register</Link>
        </p>
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

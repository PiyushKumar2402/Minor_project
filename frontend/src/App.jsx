import { useEffect, useState } from "react";
import { checkApiHealth } from "./api/health.js";

function App() {
  const [status, setStatus] = useState("checking...");

  useEffect(() => {
    checkApiHealth()
      .then((data) => setStatus(data.message))
      .catch(() => setStatus("API not reachable — is the backend running?"));
  }, []);

  return (
    <div style={{ fontFamily: "sans-serif", padding: "2rem" }}>
      <h1>Doctor Appointment & Queue Management System</h1>
      <p>Stage 1 scaffolding — backend/frontend wiring check.</p>
      <p>
        <strong>API status:</strong> {status}
      </p>
    </div>
  );
}

export default App;

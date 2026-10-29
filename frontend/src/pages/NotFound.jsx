import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="container narrow" style={{ textAlign: "center", paddingTop: "3rem" }}>
      <h1>Page not found</h1>
      <p className="subtitle">The page you're looking for doesn't exist or has moved.</p>
      <Link to="/" className="btn" style={{ marginTop: "1rem" }}>Back to home</Link>
    </div>
  );
}

export default NotFound;

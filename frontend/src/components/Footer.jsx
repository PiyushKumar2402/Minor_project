import { Link } from "react-router-dom";
import { CLINIC } from "../config/clinic.js";

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-in">
        <div>
          <div className="footer-brand">{CLINIC.name}</div>
          <p>{CLINIC.tagline}. Book a doctor, get a queue number and follow your turn live.</p>
        </div>
        <div>
          <h4>Quick links</h4>
          <Link to="/doctors">Book an appointment</Link>
          <Link to="/contact">Contact us</Link>
          <Link to="/login">Login</Link>
        </div>
        <div>
          <h4>Reach us</h4>
          <p>Helpline {CLINIC.helpline}<br />{CLINIC.email}<br />{CLINIC.hours}</p>
        </div>
      </div>
      <div className="footer-base">© {new Date().getFullYear()} {CLINIC.name}. Minor project.</div>
    </footer>
  );
}

export default Footer;

import React from "react";
import { Link } from "react-router-dom";
import {
  FiTwitter,
  FiInstagram,
  FiLinkedin,
  FiSend,
  FiMail,
  FiPhone,
} from "react-icons/fi";
import "./Footer.css";
import logo from "../assets/OgesLogo.png";

const Footer = () => {
  return (
    <footer className="footer-premium">
      <div className="footer-top-glow"></div>
      <div className="footer-container">
        <div className="footer-grid">
          <div className="footer-brand-col">
            <div className="footer-logo">
              <img
                src={logo}
                alt="LMS"
                className="footer-logo-img"
              />
              <span className="logo-text">
                LMS <span className="logo-dot"></span>
              </span>
            </div>
            <p className="brand-desc">
              Empowering learners with a gamified, high-performance education
              platform. Master new skills through immersive, short-form content.
            </p>
            <div className="footer-contact-info">
              <div className="contact-row">
                <FiMail size={16} />
                <a href="mailto:satyam.soni@oges.co">satyam.soni@oges.co</a>
              </div>
            </div>
          </div>

          <div className="footer-links-col">
            <h4 className="footer-title">Platform</h4>
            <ul className="footer-ul">
              <li>
                <Link to="/courses">Explore Courses</Link>
              </li>
              <li>
                <Link to="/categories">Categories</Link>
              </li>
              <li>
                <Link to="/admins">Training Leads</Link>
              </li>
              <li>
                <Link to="/leaderboard">Leaderboard</Link>
              </li>
            </ul>
          </div>

          <div className="footer-links-col">
            <h4 className="footer-title">Student</h4>
            <ul className="footer-ul">
              <li>
                <Link to="/dashboard">My Dashboard</Link>
              </li>
              <li>
                <Link to="/assignments">Assignments</Link>
              </li>
              <li>
                <Link to="/profile">My Profile</Link>
              </li>
              <li>
                <Link to="/auth">Account Settings</Link>
              </li>
            </ul>
          </div>

          <div className="footer-links-col">
            <h4 className="footer-title">Support</h4>
            <ul className="footer-ul">
              <li>
                <a href="#">Help Center</a>
              </li>
              <li>
                <a href="#">Terms of Service</a>
              </li>
              <li>
                <a href="#">Privacy Policy</a>
              </li>
              <li>
                <Link to="/admins">Contact Support</Link>
              </li>
            </ul>
          </div>

          <div className="footer-newsletter-col">
            <h4 className="footer-title">Newsletter</h4>
            <p>Get the latest updates and learning tips.</p>
            <form
              className="newsletter-form-premium"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="newsletter-input-group">
                <input type="email" placeholder="Email address" required />
                <button type="submit" className="newsletter-btn-icon">
                  <FiSend size={20} />
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="footer-bottom-premium">
          <div className="bottom-left">
            <p>© 2026 LMS Oges. All rights reserved.</p>
          </div>
          <div className="bottom-right">
            <span>Built for the future of learning</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

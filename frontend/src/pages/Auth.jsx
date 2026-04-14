import React, { useState } from "react";
import "./Auth.css";
import {
  FiBookOpen,
  FiBriefcase,
  FiSun,
  FiMoon,
  FiEye,
  FiEyeOff,
  FiCheckCircle,
  FiMail,
  FiLock,
  FiShield,
} from "react-icons/fi";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import api from "../services/api";
import logo from "../assets/OgesLogo.png";

const Auth = ({
  onAuthSuccess,
  initialIsLogin = true,
  isDarkMode,
  onToggleTheme,
}) => {
  const [isLogin, setIsLogin] = useState(initialIsLogin);
  const [role, setRole] = useState("learner");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState("role"); // 'role', 'category', 'form'
  const [category, setCategory] = useState("");
  const [showCustomCat, setShowCustomCat] = useState(false);
  const [customCatValue, setCustomCatValue] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const toggleAuth = () => {
    setShowForgotPassword(false);
    setSuccessMessage("");
    setError("");
    if (isLogin) {
      // Switching to signup
      setOnboardingStep("role");
    }
    setIsLogin(!isLogin);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);

    try {
      const res = await api.post("/auth/forgot-password", { Lms_email: email });
      setSuccessMessage(res.data.message);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to send reset link.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        const res = await api.post("/auth/login", {
          Lms_email: email,
          password,
        });
        localStorage.setItem("token", res.data.access_token);
        localStorage.setItem("user", JSON.stringify(res.data));
        onAuthSuccess(res.data);
      } else {
        const res = await api.post("/auth/signup", {
          Lms_full_name: fullName,
          Lms_email: email,
          password,
          Lms_role: role,
          Lms_category: category,
        });
        localStorage.setItem("token", res.data.access_token);
        localStorage.setItem("user", JSON.stringify(res.data));
        onAuthSuccess(res.data);
      }
    } catch (err) {
      setError(
        err.response?.data?.detail || "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="bg-blur-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>
      <div className="theme-switch-container">
        <button
          className={`theme-btn ${!isDarkMode ? "active" : ""}`}
          onClick={() => (!isDarkMode ? null : onToggleTheme())}
          aria-label="Light Mode"
        >
          <FiSun size={18} />
          <span>Light</span>
        </button>
        <button
          className={`theme-btn ${isDarkMode ? "active" : ""}`}
          onClick={() => (isDarkMode ? null : onToggleTheme())}
          aria-label="Dark Mode"
        >
          <FiMoon size={18} />
          <span>Dark</span>
        </button>
      </div>
      <main className="auth-container">
        <div className="auth-visual-panel">
          <div>
            <div className="visual-top-brand">
              <img src={logo} alt="Oges" className="auth-panel-logo" />
            </div>

            <div className="visual-hero-text">
              <h2>
                Learning <br />
                Management
                <br />
                <span style={{ color: "var(--primary-orange, #f97316)" }}>
                  System
                </span>
              </h2>
              <p
                style={{
                  fontSize: "1rem",
                  fontWeight: "500",
                  opacity: "0.9",
                  marginTop: "-1rem",
                }}
              >
                Synchronize Your Learning, Simplify Your Progress.
              </p>
            </div>

            <div className="visual-features-list">
              <ul>
                <li>
                  <FiCheckCircle color="#ef4444" size={18} /> Smart Learning
                  Tracking System
                </li>
                <li>
                  <FiCheckCircle color="#ef4444" size={18} /> Role-Based Access
                  Control
                </li>
                <li>
                  <FiCheckCircle color="#ef4444" size={18} /> Assignment / Quiz
                  Automation
                </li>
                <li>
                  <FiCheckCircle color="#ef4444" size={18} /> Secure Login &
                  Permissions
                </li>
              </ul>
            </div>
          </div>

          <div className="visual-bottom-footer">
            <p>© 2024 OGES Solutions Private Limited. All Rights Reserved.</p>
          </div>
        </div>

        <div className="auth-form-panel">
          <div className="form-container-glass">
            <div
              className="auth-header-section"
              style={{ textAlign: "center" }}
            >
              <h1
                style={{
                  fontSize: "1.8rem",
                  fontWeight: "800",
                  marginBottom: "0.2rem",
                }}
              >
                {isLogin ? "Welcome Back" : "Create an Account"}
              </h1>
              <p
                className="auth-subtitle"
                style={{ marginBottom: "2rem", fontSize: "0.85rem" }}
              >
                {isLogin
                  ? "Sign in to access your secure workspace."
                  : "Join the Oges learning network."}
              </p>
            </div>

            {error && <div className="auth-alert alert-error">{error}</div>}
            {successMessage && (
              <div className="auth-alert alert-success">{successMessage}</div>
            )}

            {showForgotPassword ? (
              <div className="forgot-password-flow">
                <h2>Portal Access Recovery</h2>
                <p className="onboarding-desc">
                  Provide your registered email to receive a secure recovery
                  link.
                </p>
                <form
                  className="auth-main-form"
                  onSubmit={handleForgotPassword}
                >
                  <div className="input-field-group">
                    <label htmlFor="reset-email">EMAIL ADDRESS</label>
                    <div className="input-with-icon">
                      <input
                        id="reset-email"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="submit-auth-btn"
                    disabled={loading}
                  >
                    {loading ? "Processing..." : "Send Recovery Link"}
                  </button>
                </form>
                <div className="form-toggle-footer">
                  <button
                    className="switch-auth-link"
                    onClick={() => setShowForgotPassword(false)}
                  >
                    Back to Login
                  </button>
                </div>
              </div>
            ) : !isLogin && onboardingStep === "role" ? (
              <div className="onboarding-role-selection">
                <h2>Staff Role Identification</h2>
                <p className="onboarding-desc">
                  Identify your organizational role to configure your portal
                  experience.
                </p>
                <div className="role-cards-grid">
                  <div
                    className={`role-card-premium ${role === "learner" ? "active" : ""}`}
                    onClick={() => {
                      setRole("learner");
                      setOnboardingStep("category");
                    }}
                  >
                    <div className="role-card-icon">
                      <FiBookOpen />
                    </div>
                    <div className="role-card-info">
                      <h3>Standard Employee</h3>
                      <p>
                        Access assigned trainings, track project milestones, and
                        earn certifications.
                      </p>
                    </div>
                  </div>
                  <div
                    className={`role-card-premium ${role === "admin" ? "active" : ""}`}
                    onClick={() => {
                      setRole("admin");
                      setOnboardingStep("form");
                    }}
                  >
                    <div className="role-card-icon">
                      <FiBriefcase />
                    </div>
                    <div className="role-card-info">
                      <h3>Account Administrator</h3>
                      <p>
                        Manage workforce development, audit compliance, and
                        supervise team progress.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : !isLogin && onboardingStep === "category" ? (
              <div className="onboarding-category-selection">
                <h2>Skill Domain Specialization</h2>
                <p className="onboarding-desc">
                  Specify your primary area of operations.
                </p>
                <div className="category-grid-chips">
                  {[
                    { id: "Frontend Development", icon: "🎨" },
                    { id: "Backend Development", icon: "⚙️" },
                    { id: "Data Science", icon: "📊" },
                    { id: "Cloud Computing", icon: "☁️" },
                  ].map((cat) => (
                    <div
                      key={cat.id}
                      className={`category-chip-premium ${category === cat.id ? "active" : ""}`}
                      onClick={() => {
                        setCategory(cat.id);
                        setShowCustomCat(false);
                        setOnboardingStep("form");
                      }}
                    >
                      <span className="cat-icon-mini">{cat.icon}</span>
                      <span className="cat-label-mini">{cat.id}</span>
                    </div>
                  ))}
                  <div
                    className={`category-chip-premium ${showCustomCat ? "active" : ""}`}
                    onClick={() => setShowCustomCat(true)}
                  >
                    <span className="cat-icon-mini">✨</span>
                    <span className="cat-label-mini">Other</span>
                  </div>
                </div>

                {showCustomCat && (
                  <div className="custom-category-input-area">
                    <input
                      type="text"
                      placeholder="What would you like to learn?"
                      value={customCatValue}
                      onChange={(e) => setCustomCatValue(e.target.value)}
                      autoFocus
                    />
                    <button
                      className="btn-continue-custom"
                      disabled={!customCatValue.trim()}
                      onClick={() => {
                        setCategory(customCatValue);
                        setOnboardingStep("form");
                      }}
                    >
                      Continue
                    </button>
                  </div>
                )}

                <div className="onboarding-footer-actions">
                  <button
                    className="btn-skip-cat"
                    onClick={() => {
                      setCategory("General");
                      setOnboardingStep("form");
                    }}
                  >
                    Skip for now
                  </button>
                </div>
              </div>
            ) : (
              <>
                {!isLogin && (
                  <div className="form-back-role">
                    <button
                      className="btn-back-step"
                      onClick={() =>
                        setOnboardingStep(
                          role === "learner" ? "category" : "role",
                        )
                      }
                    >
                      ← Back
                    </button>
                  </div>
                )}
                <form className="auth-main-form" onSubmit={handleSubmit}>
                  {!isLogin && (
                    <div className="input-field-group">
                      <label htmlFor="fullName">FULL NAME</label>
                      <input
                        id="fullName"
                        type="text"
                        placeholder="e.g. John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>
                  )}
                  <div className="input-field-group">
                    <label htmlFor="email">EMAIL ADDRESS</label>
                    <div className="input-with-icon">
                      <input
                        id="email"
                        type="email"
                        placeholder="satyam.soni@oges.co"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="input-field-group">
                    <div className="label-row">
                      <label htmlFor="password">PASSWORD</label>
                      {isLogin && (
                        <button
                          type="button"
                          className="forgot-password-link-btn"
                          onClick={() => setShowForgotPassword(true)}
                        >
                          Forgot?
                        </button>
                      )}
                    </div>
                    <div className="password-input-wrapper input-with-icon">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <FiEyeOff size={18} />
                        ) : (
                          <FiEye size={18} />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="submit-auth-btn"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="loader-dots">
                        <span>.</span>
                        <span>.</span>
                        <span>.</span>
                      </span>
                    ) : isLogin ? (
                      <>
                        <FiShield /> Secure Authentication
                      </>
                    ) : (
                      "Join Oges"
                    )}
                  </button>
                </form>
              </>
            )}

            <footer className="form-toggle-footer">
              <p>
                {isLogin ? "Need an account?" : "Already have an account?"}
                <button className="switch-auth-link" onClick={toggleAuth}>
                  {isLogin ? "Register Now" : "Sign In"}
                </button>
              </p>
            </footer>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Auth;

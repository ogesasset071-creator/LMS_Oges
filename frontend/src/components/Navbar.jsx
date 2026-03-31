import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import { FiSearch, FiSun, FiMoon, FiUser, FiLogOut } from "react-icons/fi";
import "./Navbar.css";
import logo from "../assets/Compaylogo.png";
const Navbar = ({
  onProfileClick,
  onHomeClick,
  onDashboardClick,
  onExploreClick,
  onCategoriesClick,
  onTutorsClick,
  onLoginClick,
  onSignupClick,
  onLogout,
  isLoggedIn,
  isDarkMode,
  user,
  onToggleTheme,
  sessionTime = 0,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [allCourses, setAllCourses] = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await api.get("/courses");
        setAllCourses(res.data.courses || []);
      } catch {
        /* fail quiet */
      }
    };
    fetchAll();
  }, []);

  const suggestions = useMemo(() => {
    if (searchValue.trim().length > 1) {
      return allCourses
        .filter(
          (c) =>
            c.title.toLowerCase().includes(searchValue.toLowerCase()) ||
            c.category.toLowerCase().includes(searchValue.toLowerCase()),
        )
        .slice(0, 6);
    }
    return [];
  }, [searchValue, allCourses]);

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}m ${secs < 10 ? "0" : ""}${secs}s`;
  };

  const handleSearch = (e) => {
    if (e.key === "Enter" && searchValue.trim()) {
      const term = searchValue.trim();
      setSearchValue("");
      navigate(`/courses?search=${encodeURIComponent(term)}`);
    }
  };

  const toggleExplore = () => {
    setIsExploreOpen(!isExploreOpen);
  };

  return (
    <nav className="navbar sticky-top">
      <div className="nav-left">
        <div className="nav-brand-text nav-brand-flex" onClick={onHomeClick}>
          <img src={logo} alt="LMS" className="nav-brand-img" />
          <span>LMS </span>
        </div>

        <div className="nav-links-main">
          <div className="nav-dropdown">
            <button
              className={`nav-link ${location.pathname === "/courses" || location.pathname === "/categories" || location.pathname === "/tutors" ? "active" : ""}`}
              onClick={toggleExplore}
            >
              Explore{" "}
              <span className={`arrow ${isExploreOpen ? "up" : "down"}`}></span>
            </button>
            {isExploreOpen && (
              <div className="dropdown-content show">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onExploreClick();
                    setIsExploreOpen(false);
                  }}
                >
                  Trainings
                </a>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onCategoriesClick();
                    setIsExploreOpen(false);
                  }}
                >
                  Categories
                </a>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onTutorsClick();
                    setIsExploreOpen(false);
                  }}
                >
                  Admins
                </a>
              </div>
            )}
          </div>
          {/* <button className={`nav-link ${location.pathname === '/learning' ? 'active ' : ''}pulse-highlight`} onClick={onPulseClick}>
            Pulse
          </button> */}

          {isLoggedIn && (
            <>
              <button
                className={`nav-link ${location.pathname === "/dashboard" ? "active" : ""}`}
                onClick={onDashboardClick}
              >
                Dashboard
              </button>
            </>
          )}
        </div>
      </div>

      <div className="nav-center">
        <div className="search-bar-container">
          <div className="search-bar">
            <FiSearch className="search-icon-svg" size={18} />
            <input
              type="text"
              placeholder="Search trainings, topics..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={handleSearch}
            />
          </div>
          {suggestions.length > 0 && (
            <div className="search-suggestions-dropdown">
              {suggestions.map((s) => (
                <div
                  key={s.id}
                  className="suggestion-item"
                  onClick={() => {
                    setSearchValue("");
                    navigate(`/player/${s.id}`);
                  }}
                >
                  <FiSearch size={14} className="s-icon" />
                  <div className="s-text">
                    <span className="s-title">{s.title}</span>
                    <span className="s-meta">
                      {s.category} • {s.tutor_name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="nav-right">
        <button
          className="theme-toggle-nav"
          onClick={onToggleTheme}
          aria-label="Toggle Theme"
        >
          {isDarkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
        </button>

        {isLoggedIn ? (
          <div className="nav-user-area">
            <div className="nav-stat-item session-time-badge">
              {formatTime(sessionTime)}
            </div>
            <div className="nav-stat-item streak-badge">
              {user?.streak || 1} Days
            </div>
            <div className="nav-stat-item xp-badge">{user?.xp || 0} XP</div>
            <div className="nav-stat-item pp-badge">{user?.pp || 0} PP</div>

            <div className="profile-container" onClick={onProfileClick}>
              <div className="profile-avatar">
                {user?.avatar && user.avatar !== "" ? (
                  <img
                    src={user.avatar}
                    alt="Avatar"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.parentNode.innerHTML =
                        '<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="20" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
                    }}
                  />
                ) : (
                  <FiUser size={20} />
                )}
              </div>
            </div>

            <button
              className="nav-btn-logout-mini"
              onClick={onLogout}
              title="Log Out"
            >
              <FiLogOut size={18} />
            </button>
          </div>
        ) : (
          <div className="nav-auth-btns">
            <button className="nav-btn-login" onClick={onLoginClick}>
              Log in
            </button>
           
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

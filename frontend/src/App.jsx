import { useState, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useLocation,
  Navigate,
} from "react-router-dom";
import "./App.css";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import Courses from "./pages/Courses";
import Categories from "./pages/Categories";
import Admins from "./pages/Admins";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import Dashboard from "./pages/Dashboard";
import Assignments from "./pages/Assignments";

import AdminPanel from "./pages/AdminPanel";
import Player from "./pages/Player";
import AssignmentDetails from "./pages/AssignmentDetails";
import Navbar from "./components/Navbar";
import AdminProfile from "./pages/AdminProfile";
import ResetPassword from "./pages/ResetPassword";
import api from "./services/api";

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved === "dark";
  });

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem("token") && !!localStorage.getItem("user"),
  );
  const [sessionTime, setSessionTime] = useState(() => {
    const saved = localStorage.getItem("sessionTime");
    return saved ? parseInt(saved, 10) : 0;
  });
  const [isGlobalVideoPlaying, setIsGlobalVideoPlaying] = useState(false);

  useEffect(() => {
    localStorage.setItem("sessionTime", sessionTime.toString());
  }, [sessionTime]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark-theme");
      document.documentElement.classList.remove("light-theme");
    } else {
      document.documentElement.classList.add("light-theme");
      document.documentElement.classList.remove("dark-theme");
    }
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  useEffect(() => {
    let interval = null;
    if (isLoggedIn) {
      interval = setInterval(() => setSessionTime((prev) => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  // --- GLOBAL ANTI-IDLE (10s) ---
  const [lastActivity, setLastActivity] = useState(() => Date.now());
  const [isShowingIdlePopup, setIsShowingIdlePopup] = useState(false);

  useEffect(() => {
    if (!isLoggedIn || user?.Lms_role !== "learner")
      return;

    const handleActivity = () => {
      setLastActivity(Date.now());
    };

    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("scroll", handleActivity);
    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("scroll", handleActivity);
    };
  }, [isLoggedIn, user]);

  const logout = useCallback(() => {
    setIsLoggedIn(false);
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setSessionTime(0);
    localStorage.removeItem("sessionTime");
    navigate("/");
  }, [navigate]);

  useEffect(() => {
    if (
      !isLoggedIn ||
      user?.Lms_role !== "learner" ||
      isGlobalVideoPlaying
    )
      return;

    const intervalId = setInterval(() => {
      const now = Date.now();
      if (now - lastActivity > 5000000 && !isShowingIdlePopup) {
        setIsShowingIdlePopup(true);
        Swal.fire({
          title: "Hey! Are you active? 👋",
          text: "We noticed you haven't moved your cursor for 10 seconds. Keep on track!",
          icon: "warning",
          confirmButtonText: "Yes, I'm Learning!",
          confirmButtonColor: "#f59e0b",
          allowOutsideClick: false,
          timer: 15000,
          timerProgressBar: true,
          backdrop: `rgba(0,0,123,0.4) url("/images/nyan-cat.gif") left top no-repeat`,
        }).then((result) => {
          setIsShowingIdlePopup(false);
          if (result.isConfirmed) {
            setLastActivity(Date.now());
          } else if (result.dismiss === Swal.DismissReason.timer) {
            // If user didn't click and timer expired -> Logout
            logout();
          } else {
            setLastActivity(Date.now());
          }
        });
      }
    }, 2000);
    return () => clearInterval(intervalId);
  }, [
    lastActivity,
    isShowingIdlePopup,
    isLoggedIn,
    user,
    isGlobalVideoPlaying,
    logout,
  ]);

  const handleUpdateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      api
        .get("/user/me")
        .then((res) => {
          if (res.data) handleUpdateUser(res.data);
        })
        .catch((err) => {
          console.warn("Could not sync user profile", err);
        });
    }
  }, [isLoggedIn, handleUpdateUser]);

  const toggleTheme = () => setIsDarkMode((prev) => !prev);

  const handleAuthSuccess = (userData) => {
    setIsLoggedIn(true);
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", userData.access_token);
    if (userData.Lms_role === "admin")
      navigate("/admin");
    else navigate("/");
  };

  const commonNavProps = {
    onProfileClick: () => navigate("/profile"),
    onHomeClick: (path = "/") =>
      navigate(typeof path === "string" ? path : "/"),
    onDashboardClick: () => navigate("/dashboard"),

    onExploreClick: () => navigate("/courses"),
    onCategoriesClick: () => navigate("/categories"),
    onAdminsClick: () => navigate("/admins"),
    onLoginClick: () => navigate("/login"),
    onLogout: logout,
    isLoggedIn,
    isDarkMode,
    user,
    onToggleTheme: toggleTheme,
    sessionTime,
    setIsGlobalVideoPlaying,
  };

  return (
    <>
      {!location.pathname.startsWith("/admin/") &&
        location.pathname !== "/admin" &&
        !location.pathname.startsWith("/super-admin") &&
        (isLoggedIn ||
          (location.pathname !== "/" &&
            location.pathname !== "/login" &&
            location.pathname !== "/signup")) && (
          <Navbar {...commonNavProps} onLogout={logout} />
        )}
      <Routes>
        <Route
          path="/"
          element={
            isLoggedIn ? (
              <Home {...commonNavProps} onLogout={logout} />
            ) : (
              <Auth
                onAuthSuccess={handleAuthSuccess}
                isDarkMode={isDarkMode}
                onToggleTheme={toggleTheme}
                initialIsLogin={true}
              />
            )
          }
        />
        <Route
          path="/login"
          element={
            isLoggedIn ? (
              <Navigate to="/" />
            ) : (
              <Auth
                onAuthSuccess={handleAuthSuccess}
                isDarkMode={isDarkMode}
                onToggleTheme={toggleTheme}
                initialIsLogin={true}
              />
            )
          }
        />
        <Route
          path="/signup"
          element={
            isLoggedIn ? (
              <Navigate to="/" />
            ) : (
              <Auth
                onAuthSuccess={handleAuthSuccess}
                isDarkMode={isDarkMode}
                onToggleTheme={toggleTheme}
                initialIsLogin={false}
              />
            )
          }
        />
        <Route path="/courses" element={<Courses {...commonNavProps} />} />
        <Route
          path="/categories"
          element={<Categories {...commonNavProps} />}
        />
        <Route path="/admins" element={<Admins {...commonNavProps} />} />
        <Route
          path="/tutor/:id"
          element={<AdminProfile {...commonNavProps} />}
        />
        <Route
          path="/profile"
          element={
            <Profile {...commonNavProps} onUserUpdate={handleUpdateUser} />
          }
        />
        <Route
          path="/dashboard"
          element={
            <Dashboard {...commonNavProps} user={user} onLogout={logout} />
          }
        />
        <Route
          path="/assignments"
          element={<Assignments {...commonNavProps} />}
        />
        <Route
          path="/assignment/:id"
          element={
            <AssignmentDetails
              {...commonNavProps}
              onUserUpdate={handleUpdateUser}
            />
          }
        />
        <Route
          path="/player/:courseId"
          element={
            <Player
              {...commonNavProps}
              onUserUpdate={handleUpdateUser}
              setIsGlobalVideoPlaying={setIsGlobalVideoPlaying}
            />
          }
        />
        <Route path="/super-admin" element={<AdminPanel onLogout={logout} />} />
        <Route
          path="/admin"
          element={
            <AdminDashboard
              onLogout={logout}
              isDarkMode={isDarkMode}
              onToggleTheme={toggleTheme}
            />
          }
        />
        <Route
          path="/admin/edit/:courseId"
          element={
            <AdminDashboard
              onLogout={logout}
              isDarkMode={isDarkMode}
              onToggleTheme={toggleTheme}
            />
          }
        />
        <Route
          path="/admin/details/:courseId"
          element={
            <AdminDashboard
              onLogout={logout}
              isDarkMode={isDarkMode}
              onToggleTheme={toggleTheme}
            />
          }
        />
        <Route
          path="/admin/:tab"
          element={
            <AdminDashboard
              onLogout={logout}
              isDarkMode={isDarkMode}
              onToggleTheme={toggleTheme}
            />
          }
        />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;

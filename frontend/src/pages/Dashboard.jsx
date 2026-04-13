import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "./adminDashboard.css"; // Reuse the clean sidebar layout
import Navbar from "../components/Navbar";
import api from "../services/api";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

import {
  FiHome,
  FiBookOpen,
  FiCheckCircle,
  FiClock,
  FiUser,
  FiLogOut,
  FiSun,
  FiMoon,
  FiTrendingUp,
  FiPlayCircle,
  FiFileText,
  FiAward,
  FiXCircle,
  FiDownload,
  FiStar,
  FiShare2,
  FiLock,
  FiActivity,
} from "react-icons/fi";

const Dashboard = ({
  onProfileClick,
  onHomeClick,
  user,
  onLogout,
  isDarkMode,
  onToggleTheme,
}) => {
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState("Dashboard");
  const [stats, setStats] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const handleViewCertificate = (course) => {
    const certHtml = document.getElementById(`cert-template-${course.id}`).innerHTML;

    Swal.fire({
      title: 'Official Certificate of Achievement',
      html: `
        <div style="
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          height: 480px;
          overflow: hidden;
          margin-top: 1rem;
        ">
          <div class="onsite-cert-viewer" style="
            width: 1000px;
            height: 700px;
            flex-shrink: 0;
            background: #fff;
            border-radius: 20px;
            box-shadow: 0 15px 50px rgba(0,0,0,0.15);
            transform: scale(0.65);
            transform-origin: top center;
            user-select: none;
            pointer-events: none;
            position: relative;
            border: 1px solid rgba(0,0,0,0.05);
          ">
            ${certHtml}
          </div>
        </div>
        <div style="margin-top: 2rem; color: var(--text-sub); font-size: 0.9rem; font-weight: 600; line-height: 1.5;">
          🛡️ This is an official onsite-only credential. <br/>
          <span style="opacity: 0.8;">Sharing and downloading are restricted to maintain authenticity.</span>
        </div>
      `,
      showConfirmButton: false,
      showCloseButton: true,
      width: '800px',
      background: 'var(--card-bg)',
      customClass: {
        popup: 'premium-onsite-modal'
      }
    });
  };

  // Stats & Courses fetching — independent calls so one failure doesn't block the rest
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/dashboard/stats");
        setStats(res.data);
      } catch (e) {
        console.error("Error fetching dashboard stats", e);
      }
    };
    const fetchCourses = async () => {
      try {
        const res = await api.get("/user/courses");
        setEnrolledCourses(res.data);
      } catch (e) {
        console.error("Error fetching user trainings", e);
      }
    };
    const fetchAssignments = async () => {
      try {
        const res = await api.get("/assignments");
        setAssignments(res.data);
      } catch (e) {
        console.error("Error fetching assignments", e);
      }
    };
    fetchStats();
    fetchCourses();
    fetchAssignments();
  }, []);

  const getAchievements = () => {
    const xp = user?.Lms_xp || 0;
    const tiers = [
      { threshold: 100, name: "Starter 🥉", icon: "🥉" },
      { threshold: 500, name: "Scholar 🥈", icon: "🥈" },
      { threshold: 1000, name: "Professional 🥇", icon: "🥇" },
      { threshold: 2000, name: "Intermediate 📘", icon: "📘" },
      { threshold: 4000, name: "Advanced 📙", icon: "📙" },
      { threshold: 6000, name: "Expert 💎", icon: "💎" },
      { threshold: 10000, name: "Legend 💠", icon: "💠" },
    ];
    return tiers.map((t) => ({
      ...t,
      unlocked: xp >= t.threshold,
    }));
  };

  const handleCompleteAssignment = (id) => {
    navigate(`/assignment/${id}`);
  };

  const renderTabContent = () => {
    switch (currentTab) {
      case "Dashboard":
        return (
          <div className="edu-content-scroll">
            <div
              className="dashboard-stats-grid"
              style={{ marginBottom: "2rem" }}
            >
              {/* --- NEW XP & LEVEL SECTION --- */}
              <section
                className="edu-section premium-padding level-card-dashboard"
                style={{
                  gridColumn: "span 1",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.5rem",
                }}
              >
                <div className="level-flex-dashboard">
                  <div className="level-text">
                    <span className="level-badge-premium">
                      LEVEL {Math.floor((user?.Lms_xp || 0) / 1000) + 1}
                    </span>
                    <h2 style={{ marginTop: "0.5rem" }}>
                      {user?.Lms_xp || 0} XP Total
                    </h2>
                    <p style={{ color: "var(--text-sub)", fontSize: "0.9rem" }}>
                      {1000 - ((user?.Lms_xp || 0) % 1000)} XP to next milestone
                    </p>
                  </div>
                  <div
                    className="xp-bar-container-dashboard"
                    style={{ flex: 1 }}
                  >
                    <div
                      className="xp-bar-track-dashboard"
                      style={{
                        height: "12px",
                        background: "var(--border-color)",
                        borderRadius: "10px",
                        overflow: "hidden",
                        position: "relative",
                      }}
                    >
                      <div
                        className="xp-bar-fill-premium"
                        style={{
                          width: `${((user?.Lms_xp || 0) % 1000) / 10}%`,
                          height: "100%",
                          background: "var(--gradient-blue)",
                          transition: "width 1s ease",
                        }}
                      ></div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: "0.5rem",
                        fontSize: "0.8rem",
                        fontWeight: "700",
                      }}
                    >
                      <span>
                        Level {Math.floor((user?.Lms_xp || 0) / 1000) + 1}
                      </span>
                      <span>
                        Level {Math.floor((user?.Lms_xp || 0) / 1000) + 2}
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* --- RECENTLY CONTINUED --- */}
            {stats?.recent_courses && stats.recent_courses.length > 0 && (
              <section
                className="edu-section premium-padding"
                style={{ marginBottom: "2rem" }}
              >
                <h2 className="section-title">Continue Where You Left Off</h2>
                <div
                  className="recent-courses-row"
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: "1.5rem",
                    marginTop: "1.5rem",
                  }}
                >
                  {stats.recent_courses.map((rc) => (
                    <div
                      key={rc.id}
                      className="rc-card-dashboard"
                      onClick={() => onHomeClick(`/player/${rc.id}`)}
                      style={{
                        background: "var(--card-bg)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "1.2rem",
                        padding: "1rem",
                        display: "flex",
                        gap: "1rem",
                        cursor: "pointer",
                        transition: "var(--transition-smooth)",
                      }}
                    >
                      <img
                        src={rc.thumbnail}
                        alt={rc.title}
                        style={{
                          width: "60px",
                          height: "60px",
                          borderRadius: "12px",
                          objectFit: "cover",
                        }}
                      />
                      <div className="rc-info">
                        <h4
                          style={{ fontSize: "0.9rem", marginBottom: "0.4rem" }}
                        >
                          {rc.title}
                        </h4>
                        <div
                          className="rc-progress-mini"
                          style={{
                            width: "100%",
                            height: "4px",
                            background: "var(--border-color)",
                            borderRadius: "2px",
                            position: "relative",
                          }}
                        >
                          <div
                            style={{
                              width: `${rc.progress_pct}%`,
                              height: "100%",
                              background: "var(--primary-blue)",
                              borderRadius: "2px",
                            }}
                          ></div>
                        </div>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--text-sub)",
                            marginTop: "0.4rem",
                            display: "block",
                          }}
                        >
                          {rc.progress_pct}% Complete
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div
              className="stats-row-premium"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "1.5rem",
                marginBottom: "2rem",
              }}
            >
              <div className="stat-card-premium">
                <div
                  className="stat-icon-bg"
                  style={{
                    background: "rgba(249, 115, 22, 0.1)",
                    color: "#f97316",
                  }}
                >
                  🔥
                </div>
                <div className="stat-info">
                  <span className="stat-label">Learning Streak</span>
                  <h2 className="stat-value">{user?.Lms_streak || 0} Days</h2>
                  <span
                    className="stat-trend"
                    style={{ color: "var(--primary-blue)" }}
                  >
                    Community Rank: #{stats?.rank || "N/A"}
                  </span>
                </div>
              </div>
              <div className="stat-card-premium">
                <div
                  className="stat-icon-bg"
                  style={{
                    background: "rgba(59, 130, 246, 0.1)",
                    color: "#f59e0b",
                  }}
                >
                  📚
                </div>
                <div className="stat-info">
                  <span className="stat-label">Training Enrolled</span>
                  <h2 className="stat-value">{enrolledCourses?.length || 0}</h2>
                  <span className="stat-trend">
                    {stats?.ongoing_count || 0} Active
                  </span>
                </div>
              </div>
              <div className="stat-card-premium">
                <div
                  className="stat-icon-bg"
                  style={{
                    background: "rgba(16, 185, 129, 0.1)",
                    color: "#10b981",
                  }}
                >
                  ✅
                </div>
                <div className="stat-info">
                  <span className="stat-label">Completed</span>
                  <h2 className="stat-value">{stats?.completed_count || 0}</h2>
                  <span className="stat-trend">Success stories</span>
                </div>
              </div>
            </div>

            {/* --- ACTIVITY GRAPH & SKILLS RADAR --- */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.5fr 1fr",
                gap: "2rem",
                marginBottom: "2rem",
              }}
            >
              {stats?.chart_data && stats.chart_data.length > 0 && (
                <section
                  className="edu-section premium-padding"
                  style={{ marginBottom: 0 }}
                >
                  <h2 className="section-title">Your Learning Activity</h2>
                  <div
                    style={{
                      background: "var(--card-bg)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "1.2rem",
                      padding: "1.5rem",
                      height: "300px",
                      minWidth: 0,
                    }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={stats.chart_data}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="colorActivity"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#fb923c"
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor="#fb923c"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="var(--border-color)"
                        />
                        <XAxis
                          dataKey="name"
                          stroke="var(--text-sub)"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          stroke="var(--text-sub)"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "var(--card-bg)",
                            border: "1px solid var(--border-color)",
                            borderRadius: "8px",
                            color: "var(--text-main)",
                          }}
                          itemStyle={{ color: "var(--primary-blue)", fontWeight: "bold" }}
                        />
                        <Area
                          type="monotone"
                          dataKey="activity"
                          stroke="var(--primary-blue)"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorActivity)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </section>
              )}

              {stats?.radar_data && stats.radar_data.length > 0 && (
                <section
                  className="edu-section premium-padding"
                  style={{ marginBottom: 0 }}
                >
                  <h2 className="section-title">Skills Overview</h2>
                  <div
                    style={{
                      background: "var(--card-bg)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "1.2rem",
                      padding: "1.5rem",
                      height: "300px",
                      minWidth: 0,
                    }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart
                        cx="50%"
                        cy="50%"
                        outerRadius="70%"
                        data={stats.radar_data}
                      >
                        <PolarGrid stroke="var(--border-color)" />
                        <PolarAngleAxis
                          dataKey="subject"
                          tick={{ fill: "var(--text-sub)", fontSize: 10 }}
                        />
                        <PolarRadiusAxis
                          angle={30}
                          domain={[0, 100]}
                          tick={false}
                          axisLine={false}
                        />
                        <Radar
                          name="Proficiency"
                          dataKey="A"
                          stroke="#f59e0b"
                          fill="#f59e0b"
                          fillOpacity={0.4}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </section>
              )}
            </div>

            {/* ═══════ TRAINING LEVEL TRACKER ═══════ */}
            {user?.Lms_category &&
              (() => {
                // Roadmap definitions (same as Home.jsx)
                const ROADMAPS = {
                  "Frontend Development": {
                    icon: "🎨",
                    levels: [
                      { name: "Beginner", chapters: ["HTML, CSS, JavaScript"] },
                      {
                        name: "Intermediate",
                        chapters: ["Angular / React, APIs, Tailwind"],
                      },
                      {
                        name: "Advanced",
                        chapters: ["Optimization, SSR, State Management"],
                      },
                    ],
                  },
                  "Backend Development": {
                    icon: "⚙️",
                    levels: [
                      {
                        name: "Beginner",
                        chapters: ["Node.js / Java / Python Basics"],
                      },
                      {
                        name: "Intermediate",
                        chapters: ["REST APIs, Auth, DB Integration"],
                      },
                      {
                        name: "Advanced",
                        chapters: ["Microservices, System Design"],
                      },
                    ],
                  },
                  "Full Stack Development": {
                    icon: "🌐",
                    levels: [
                      {
                        name: "Beginner",
                        chapters: ["Frontend + Backend Basics"],
                      },
                      { name: "Intermediate", chapters: ["MERN / MEAN Stack"] },
                      { name: "Advanced", chapters: ["Deployment, Scaling"] },
                    ],
                  },
                  "Data Science": {
                    icon: "📊",
                    levels: [
                      { name: "Beginner", chapters: ["Python, Statistics"] },
                      {
                        name: "Intermediate",
                        chapters: ["Pandas, Visualization"],
                      },
                      { name: "Advanced", chapters: ["ML Models"] },
                    ],
                  },
                  "Data Analytics": {
                    icon: "📈",
                    levels: [
                      { name: "Beginner", chapters: ["Excel, Data Cleaning"] },
                      { name: "Intermediate", chapters: ["SQL, Power BI"] },
                      { name: "Advanced", chapters: ["Dashboarding, BI"] },
                    ],
                  },
                  "Artificial Intelligence": {
                    icon: "🤖",
                    levels: [
                      { name: "Beginner", chapters: ["AI Basics"] },
                      { name: "Intermediate", chapters: ["ML Algorithms"] },
                      { name: "Advanced", chapters: ["Deep Learning, GenAI"] },
                    ],
                  },
                  "Machine Learning": {
                    icon: "🧠",
                    levels: [
                      { name: "Beginner", chapters: ["Python ML Basics"] },
                      {
                        name: "Intermediate",
                        chapters: ["Supervised/Unsupervised Learning"],
                      },
                      {
                        name: "Advanced",
                        chapters: ["Model Tuning, Deployment"],
                      },
                    ],
                  },
                  "Cloud Computing": {
                    icon: "☁️",
                    levels: [
                      { name: "Beginner", chapters: ["AWS / Azure Basics"] },
                      {
                        name: "Intermediate",
                        chapters: ["Storage, Networking"],
                      },
                      {
                        name: "Advanced",
                        chapters: ["Architecture, Serverless"],
                      },
                    ],
                  },
                  DevOps: {
                    icon: "♾️",
                    levels: [
                      { name: "Beginner", chapters: ["Linux, Git"] },
                      { name: "Intermediate", chapters: ["Docker, CI/CD"] },
                      {
                        name: "Advanced",
                        chapters: ["Advanced Kubernetes, IaC"],
                      },
                    ],
                  },
                  "Cyber Security": {
                    icon: "🔒",
                    levels: [
                      {
                        name: "Beginner",
                        chapters: ["Networking, Security Basics"],
                      },
                      { name: "Intermediate", chapters: ["Ethical Hacking"] },
                      { name: "Advanced", chapters: ["Penetration Testing"] },
                    ],
                  },
                  "Mobile App Development": {
                    icon: "📱",
                    levels: [
                      { name: "Beginner", chapters: ["Programming Basics"] },
                      {
                        name: "Intermediate",
                        chapters: ["Flutter / React Native"],
                      },
                      { name: "Advanced", chapters: ["App Deployment"] },
                    ],
                  },
                  "UI/UX Design": {
                    icon: "🎨",
                    levels: [
                      { name: "Beginner", chapters: ["Design Principles"] },
                      {
                        name: "Intermediate",
                        chapters: ["Figma, Prototyping"],
                      },
                      {
                        name: "Advanced",
                        chapters: ["Design Systems Architecture"],
                      },
                    ],
                  },
                  "Database Management": {
                    icon: "🖥️",
                    levels: [
                      { name: "Beginner", chapters: ["SQL Basics"] },
                      { name: "Intermediate", chapters: ["Joins, Indexing"] },
                      {
                        name: "Advanced",
                        chapters: ["Database Optimization, Scaling"],
                      },
                    ],
                  },
                  "Software Testing": {
                    icon: "🧪",
                    levels: [
                      { name: "Beginner", chapters: ["Manual Testing"] },
                      {
                        name: "Intermediate",
                        chapters: ["Automation (Selenium)"],
                      },
                      {
                        name: "Advanced",
                        chapters: ["Performance Testing & CI"],
                      },
                    ],
                  },
                  "Game Development": {
                    icon: "🎮",
                    levels: [
                      { name: "Beginner", chapters: ["Unity Basics"] },
                      { name: "Intermediate", chapters: ["Game Physics"] },
                      { name: "Advanced", chapters: ["Multiplayer Systems"] },
                    ],
                  },
                  "Blockchain Development": {
                    icon: "⛓️",
                    levels: [
                      { name: "Beginner", chapters: ["Blockchain Basics"] },
                      { name: "Intermediate", chapters: ["Smart Contracts"] },
                      { name: "Advanced", chapters: ["DApps, Web3 Ecosystem"] },
                    ],
                  },
                  "Internet of Things (IoT)": {
                    icon: "📡",
                    levels: [
                      { name: "Beginner", chapters: ["Sensors & Basics"] },
                      {
                        name: "Intermediate",
                        chapters: ["Microcontrollers & Protocols"],
                      },
                      { name: "Advanced", chapters: ["Advanced IoT Systems"] },
                    ],
                  },
                  "AR/VR Development": {
                    icon: "🥽",
                    levels: [
                      { name: "Beginner", chapters: ["AR/VR Foundations"] },
                      { name: "Intermediate", chapters: ["Unity AR Tools"] },
                      {
                        name: "Advanced",
                        chapters: ["Immersive Applications"],
                      },
                    ],
                  },
                  Networking: {
                    icon: "🌐",
                    levels: [
                      {
                        name: "Beginner",
                        chapters: ["Fundamental Network Basics"],
                      },
                      {
                        name: "Intermediate",
                        chapters: ["Routing & Switching"],
                      },
                      {
                        name: "Advanced",
                        chapters: ["Network Security & Architecture"],
                      },
                    ],
                  },
                  "System Design": {
                    icon: "🏗️",
                    levels: [
                      {
                        name: "Beginner",
                        chapters: ["Basics of Architecture"],
                      },
                      { name: "Intermediate", chapters: ["Design Patterns"] },
                      {
                        name: "Advanced",
                        chapters: ["Scalable High-Load Systems"],
                      },
                    ],
                  },
                };

                // Fuzzy find roadmap for user category
                const uCat = (user.Lms_category || "").toLowerCase();
                const rKey = Object.keys(ROADMAPS).find((k) => {
                  const r = k.toLowerCase();
                  return r === uCat || r.includes(uCat) || uCat.includes(r);
                });
                if (!rKey) return null;
                const road = ROADMAPS[rKey];

                // Find matching course from all courses - API fetch (we can use category match)
                const levelColors = ["#f97316", "#f59e0b", "#d97706"];

                return (
                  <section
                    className="edu-section premium-padding"
                    style={{ marginTop: "2rem" }}
                  >
                    <h2 className="section-title">
                      {road.icon} Your {rKey} Training Level
                    </h2>
                    <p
                      style={{
                        color: "var(--text-sub)",
                        marginBottom: "2rem",
                        fontSize: "0.9rem",
                      }}
                    >
                      Complete each level sequentially to unlock the next stage.
                    </p>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        gap: "1.5rem",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        flexWrap: "wrap",
                      }}
                    >
                      {road.levels.map((level, lIdx) => {
                        // Find course for THIS specific level (e.g., 'Backend Development - Beginner Mastery')
                        const levelCourse = enrolledCourses.find((c) => {
                          const title = c.title.toLowerCase();
                          const key = rKey.toLowerCase();
                          const lvlName = level.name.toLowerCase();
                          return (
                            (title.includes(key) || key.includes(title)) &&
                            title.includes(lvlName)
                          );
                        });

                        // Unlock logic based on PP points as requested
                        let isUnlocked = lIdx === 0;
                        if (lIdx === 1) isUnlocked = (user?.Lms_pp || 0) >= 2000;
                        if (lIdx === 2) isUnlocked = (user?.Lms_pp || 0) >= 4000;

                        const allThisDone =
                          levelCourse && levelCourse.progress_pct >= 100;
                        const isCurrent = isUnlocked && !allThisDone;

                        return (
                          <div
                            key={lIdx}
                            style={{
                              display: "flex",
                              alignItems: "stretch",
                              gap: "1.5rem",
                              opacity: isUnlocked ? 1 : 0.5,
                              transition: "all 0.3s ease",
                              flex: "1 1 300px",
                              minWidth: "300px",
                            }}
                          >
                            {/* Level number badge */}
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                minWidth: "60px",
                              }}
                            >
                              <div
                                style={{
                                  width: "48px",
                                  height: "48px",
                                  borderRadius: "50%",
                                  background: allThisDone
                                    ? "#10b981"
                                    : isCurrent
                                      ? levelColors[lIdx]
                                      : "#e2e8f0",
                                  color:
                                    allThisDone || isCurrent
                                      ? "white"
                                      : "#94a3b8",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontWeight: "900",
                                  fontSize: "1.2rem",
                                  border: isCurrent
                                    ? `3px solid ${levelColors[lIdx]}`
                                    : "none",
                                  boxShadow: isCurrent
                                    ? `0 0 20px ${levelColors[lIdx]}40`
                                    : "none",
                                }}
                              >
                                {allThisDone
                                  ? "✓"
                                  : isUnlocked
                                    ? lIdx + 1
                                    : "🔒"}
                              </div>
                              {lIdx < road.levels.length - 1 && (
                                <div
                                  style={{
                                    width: "3px",
                                    flex: 1,
                                    background: allThisDone
                                      ? "#10b981"
                                      : "#e2e8f0",
                                    marginTop: "4px",
                                  }}
                                ></div>
                              )}
                            </div>

                            {/* Level content card */}
                            <div
                              style={{
                                flex: 1,
                                background: isCurrent
                                  ? "var(--card-bg)"
                                  : isUnlocked
                                    ? "var(--card-bg)"
                                    : "transparent",
                                border: isCurrent
                                  ? `2px solid ${levelColors[lIdx]}`
                                  : "1px solid var(--border-color)",
                                borderRadius: "1.2rem",
                                padding: "1.5rem",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.8rem",
                                  marginBottom: "1rem",
                                }}
                              >
                                <h3 style={{ margin: 0, fontSize: "1.1rem" }}>
                                  Level {lIdx + 1} — {level.name}
                                </h3>
                                {isCurrent && (
                                  <span
                                    style={{
                                      background: levelColors[lIdx],
                                      color: "white",
                                      padding: "0.15rem 0.7rem",
                                      borderRadius: "100px",
                                      fontSize: "0.7rem",
                                      fontWeight: "800",
                                    }}
                                  >
                                    CURRENT
                                  </span>
                                )}
                                {allThisDone && (
                                  <span
                                    style={{
                                      background: "#dcfce7",
                                      color: "#166534",
                                      padding: "0.15rem 0.7rem",
                                      borderRadius: "100px",
                                      fontSize: "0.7rem",
                                      fontWeight: "800",
                                    }}
                                  >
                                    COMPLETED
                                  </span>
                                )}
                                {!isUnlocked && (
                                  <span
                                    style={{
                                      background: "#f1f5f9",
                                      color: "#64748b",
                                      padding: "0.15rem 0.7rem",
                                      borderRadius: "100px",
                                      fontSize: "0.7rem",
                                      fontWeight: "800",
                                    }}
                                  >
                                    LOCKED
                                  </span>
                                )}
                              </div>

                              {level.chapters.map((ch, cIdx) => {
                                // Try fuzzy matching for the chapter or fallback to course-level completion
                                const chObj = levelCourse?.chapters?.find(
                                  (c) =>
                                    c.title
                                      .toLowerCase()
                                      .includes(ch.toLowerCase()) ||
                                    ch
                                      .toLowerCase()
                                      .includes(c.title.toLowerCase()),
                                );
                                const isDone = chObj?.completed || allThisDone;

                                return (
                                  <div
                                    key={cIdx}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "0.8rem",
                                      padding: "0.7rem 1rem",
                                      borderRadius: "0.8rem",
                                      background: isDone
                                        ? "#f0fdf4"
                                        : isUnlocked
                                          ? "#f8fafc"
                                          : "#f1f5f9",
                                      marginBottom: "0.5rem",
                                      cursor:
                                        isUnlocked && levelCourse
                                          ? "pointer"
                                          : "default",
                                    }}
                                    onClick={() =>
                                      isUnlocked &&
                                      levelCourse &&
                                      onHomeClick(`/player/${levelCourse.id}`)
                                    }
                                  >
                                    <span style={{ fontSize: "1.1rem" }}>
                                      {isDone ? "✅" : isUnlocked ? "📖" : "🔒"}
                                    </span>
                                    <span
                                      style={{
                                        fontWeight: "600",
                                        fontSize: "0.95rem",
                                        color: isDone
                                          ? "#166534"
                                          : "var(--text-main)",
                                      }}
                                    >
                                      {ch}
                                    </span>
                                    {isDone && (
                                      <span
                                        style={{
                                          marginLeft: "auto",
                                          fontSize: "0.75rem",
                                          color: "#10b981",
                                          fontWeight: "700",
                                        }}
                                      >
                                        Done
                                      </span>
                                    )}
                                    {!isDone && isUnlocked && (
                                      <span
                                        style={{
                                          marginLeft: "auto",
                                          fontSize: "0.75rem",
                                          color: levelColors[lIdx],
                                          fontWeight: "700",
                                        }}
                                      >
                                        Start →
                                      </span>
                                    )}
                                  </div>
                                );
                              })}

                              {!isUnlocked && (
                                <p
                                  style={{
                                    color: "#94a3b8",
                                    fontSize: "0.85rem",
                                    marginTop: "0.5rem",
                                    fontStyle: "italic",
                                  }}
                                >
                                  Complete Level {lIdx} —{" "}
                                  {road.levels[lIdx - 1].name} to unlock this
                                  stage.
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })()}
          </div>
        );
      case "My Training":
        return (
          <div className="edu-content-scroll">
            <div className="my-courses-grid-modern">
              {enrolledCourses.map((course) => (
                <div
                  className="course-item-card-mini"
                  key={course.id}
                  onClick={() => onHomeClick(`/player/${course.id}`)}
                >
                  <img
                    src={
                      course.thumbnail ||
                      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3"
                    }
                    alt={course.title}
                    onError={(e) => {
                      e.target.src =
                        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3";
                    }}
                  />
                  <div className="course-item-details">
                    <h3>{course.title}</h3>
                    <p>
                      {course.category} • {course.level || "Beginner"} •{" "}
                      {Math.round(course.progress_pct)}% Done
                    </p>
                    <div className="course-item-footer">
                      <span
                        className={`status-badge ${course.progress_pct === 100 ? "live" : "draft"}`}
                        style={{
                          background:
                            course.progress_pct === 100 ? "#dcfce7" : "#dbeafe",
                          color:
                            course.progress_pct === 100 ? "#166534" : "#1e40af",
                        }}
                      >
                        {course.progress_pct === 100
                          ? "Completed"
                          : "In Progress"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {enrolledCourses.length === 0 && (
                <div className="edu-placeholder-view">
                  <h3>You haven't started any modules yet.</h3>
                </div>
              )}
            </div>
          </div>
        );
      case "Assignments":
        return (
          <div className="edu-content-scroll">
            <section className="edu-section premium-padding">
              <div className="section-header-flex">
                <h2 className="section-title">Internal Assignments & Tasks</h2>
                <span className="count-badge">
                  {assignments.filter((a) => !a.completed).length} Pending
                </span>
              </div>
              <div className="activity-list">
                <h3
                  style={{
                    fontSize: "1rem",
                    color: "var(--primary-blue)",
                    marginBottom: "1rem",
                  }}
                >
                  Pending Tasks
                </h3>
                {assignments
                  .filter((a) => a.type === "assignment" && !a.completed)
                  .map((task) => (
                    <div className="activity-item" key={task.id}>
                      <div
                        className="activity-icon-premium"
                        style={{
                          background: "rgba(59,130,246,0.1)",
                          color: "#3b82f6",
                        }}
                      >
                        <FiFileText />
                      </div>
                      <div className="activity-text">
                        <p>
                          <strong>{task.title}</strong>
                        </p>
                        <div
                          style={{
                            display: "flex",
                            gap: "0.5rem",
                            marginBottom: "0.4rem",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "0.65rem",
                              background: "rgba(59,130,246,0.1)",
                              color: "var(--primary-blue)",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              fontWeight: "700",
                            }}
                          >
                            {task.category}
                          </span>
                          <span
                            style={{
                              fontSize: "0.65rem",
                              background: "rgba(0,0,0,0.05)",
                              color: "var(--text-sub)",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              fontWeight: "700",
                            }}
                          >
                            {task.level}
                          </span>
                          <span
                            style={{
                              fontSize: "0.65rem",
                              background: "rgba(16, 185, 129, 0.1)",
                              color: "#10b981",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              fontWeight: "700",
                            }}
                          >
                            Target: {task.role || "Learner"}
                          </span>
                        </div>
                        <small style={{ color: "var(--text-sub)" }}>
                          {task.description}
                        </small>
                        {task.reward_badge && (
                          <div className="task-reward-p">
                            Reward: {task.reward_badge}
                          </div>
                        )}
                      </div>
                      <button
                        className="view-cat-btn-mini"
                        onClick={() => handleCompleteAssignment(task.id)}
                        style={{
                          marginLeft: "auto",
                          padding: "0.45rem 1.2rem",
                          borderRadius: "10px",
                          fontSize: "0.75rem",
                          background: "var(--primary-blue)",
                          color: "white",
                          fontWeight: "700",
                        }}
                      >
                        Process Assignment →
                      </button>
                    </div>
                  ))}

                <h3
                  style={{
                    fontSize: "1rem",
                    color: "var(--text-sub)",
                    marginTop: "3rem",
                    marginBottom: "1rem",
                  }}
                >
                  Submission History
                </h3>
                {assignments
                  .filter((a) => a.type === "assignment" && a.completed)
                  .map((task) => (
                    <div
                      className="activity-item done-task"
                      key={task.id}
                      style={{ opacity: 0.8, filter: "grayscale(0.5)" }}
                    >
                      <div
                        className="activity-icon-premium"
                        style={{
                          background: "rgba(16, 185, 129, 0.1)",
                          color: "#10b981",
                        }}
                      >
                        <FiCheckCircle />
                      </div>
                      <div className="activity-text">
                        <p>
                          <strong>{task.title}</strong>
                        </p>
                        <small style={{ color: "var(--text-sub)" }}>
                          {task.description}
                        </small>
                        <div
                          className="task-reward-p"
                          style={{ color: "#10b981" }}
                        >
                          Earned: {task.reward_badge} ✅
                        </div>
                      </div>
                      <span
                        style={{
                          marginLeft: "auto",
                          fontSize: "0.75rem",
                          fontWeight: "800",
                          color: "#10b981",
                          background: "rgba(16,185,129,0.1)",
                          padding: "4px 12px",
                          borderRadius: "100px",
                        }}
                      >
                        SUBMITTED
                      </span>
                    </div>
                  ))}
              </div>
            </section>
          </div>
        );
      case "Quizzes":
        return (
          <div className="edu-content-scroll">
            <section className="edu-section premium-padding">
              <div className="section-header-flex">
                <h2 className="section-title">Track Quizzes & Prep</h2>
                <span className="count-badge">
                  {
                    assignments.filter((a) => a.type === "quiz" && !a.completed)
                      .length
                  }{" "}
                  Pending
                </span>
              </div>
              <div className="activity-list">
                <h3
                  style={{
                    fontSize: "1rem",
                    color: "var(--primary-blue)",
                    marginBottom: "1rem",
                  }}
                >
                  Pending Quizzes
                </h3>
                {assignments
                  .filter((a) => a.type === "quiz" && !a.completed)
                  .map((task) => (
                    <div className="activity-item" key={task.id}>
                      <div
                        className="activity-icon-premium"
                        style={{
                          background: "rgba(59,130,246,0.1)",
                          color: "#3b82f6",
                        }}
                      >
                        <FiActivity />
                      </div>
                      <div className="activity-text">
                        <p>
                          <strong>{task.title}</strong>
                        </p>
                        <div
                          style={{
                            display: "flex",
                            gap: "0.5rem",
                            marginBottom: "0.4rem",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "0.65rem",
                              background: "rgba(59,130,246,0.1)",
                              color: "var(--primary-blue)",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              fontWeight: "700",
                            }}
                          >
                            {task.category}
                          </span>
                          <span
                            style={{
                              fontSize: "0.65rem",
                              background: "rgba(0,0,0,0.05)",
                              color: "var(--text-sub)",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              fontWeight: "700",
                            }}
                          >
                            {task.level}
                          </span>
                          <span
                            style={{
                              fontSize: "0.65rem",
                              background: "rgba(16, 185, 129, 0.1)",
                              color: "#10b981",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              fontWeight: "700",
                            }}
                          >
                            Target: {task.role}
                          </span>
                        </div>
                        <small style={{ color: "var(--text-sub)" }}>
                          {task.description}
                        </small>
                        {task.reward_badge && (
                          <div className="task-reward-p">
                            Reward: {task.reward_badge}
                          </div>
                        )}
                      </div>
                      <button
                        className="view-cat-btn-mini"
                        onClick={() => handleCompleteAssignment(task.id)}
                        style={{
                          marginLeft: "auto",
                          padding: "0.45rem 1.2rem",
                          borderRadius: "10px",
                          fontSize: "0.75rem",
                          background: "var(--primary-blue)",
                          color: "white",
                          fontWeight: "700",
                        }}
                      >
                        Start Quiz →
                      </button>
                    </div>
                  ))}

                <h3
                  style={{
                    fontSize: "1rem",
                    color: "var(--text-sub)",
                    marginTop: "3rem",
                    marginBottom: "1rem",
                  }}
                >
                  Quiz Performance
                </h3>

                <h3
                  style={{
                    fontSize: "1rem",
                    color: "var(--text-sub)",
                    marginTop: "3rem",
                    marginBottom: "1rem",
                  }}
                >
                  Quiz History
                </h3>
                {assignments
                  .filter((a) => a.type === "quiz" && a.completed)
                  .map((task) => (
                    <div
                      className="activity-item done-task"
                      key={task.id}
                      style={{ opacity: 0.8, filter: "grayscale(0.5)" }}
                    >
                      <div
                        className="activity-icon-premium"
                        style={{
                          background: "rgba(16, 185, 129, 0.1)",
                          color: "#10b981",
                        }}
                      >
                        <FiCheckCircle />
                      </div>
                      <div className="activity-text">
                        <p>
                          <strong>{task.title}</strong>
                        </p>
                        <small style={{ color: "var(--text-sub)" }}>
                          {task.description}
                        </small>
                        <div
                          className="task-reward-p"
                          style={{ color: "#10b981" }}
                        >
                          Earned: {task.reward_badge} ✅
                        </div>
                      </div>
                      <span
                        style={{
                          marginLeft: "auto",
                          fontSize: "0.75rem",
                          fontWeight: "800",
                          color: "#10b981",
                          background: "rgba(16,185,129,0.1)",
                          padding: "4px 12px",
                          borderRadius: "100px",
                        }}
                      >
                        COMPLETED
                      </span>
                    </div>
                  ))}

                {assignments.filter((a) => a.type === "quiz").length === 0 && (
                  <div className="edu-placeholder-view">
                    <p>
                      No quizzes currently assigned. Complete more modules to
                      unlock relevant track quizzes!
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>
        );
      case "Achievements":
        return (
          <div className="edu-content-scroll">
            <section className="edu-section premium-padding">
              <h2 className="section-title">XP Achievements & Tiers</h2>
              <div
                className="achievements-grid-dashboard"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: "1.5rem",
                }}
              >
                {getAchievements().map((ach, i) => (
                  <div
                    key={i}
                    className={`ach-card-premium ${ach.unlocked ? "unlocked" : "locked"}`}
                    onClick={() => {
                      if (ach.unlocked) {
                        Swal.fire({
                          title: `<h2 style="color: #1a1a1a; margin-top: 20px;">${ach.name} Achievement</h2>`,
                          html: `
                            <div style="font-size: 80px; margin: 30px 0;">${ach.icon}</div>
                            <p style="color: #64748b; font-size: 1.1rem; margin-bottom: 10px;">
                              Congratulations! You've reached <b>${ach.threshold.toLocaleString()} XP</b> and unlocked this prestigious tier.
                            </p>
                            <p style="color: var(--text-sub); font-size: 0.9rem; font-weight: 600;">
                               🏆 This achievement is part of your professional Oges LMS profile.
                            </p>
                          `,
                          showConfirmButton: true,
                          confirmButtonText: 'Great!',
                          confirmButtonColor: 'var(--primary-blue)',
                          showCloseButton: true,
                          background: "#fff",
                          borderRadius: "24px",
                        });
                      }
                    }}
                    style={{
                      background: ach.unlocked
                        ? "var(--card-bg)"
                        : "rgba(0,0,0,0.02)",
                      padding: "2rem",
                      borderRadius: "1.5rem",
                      textAlign: "center",
                      border: ach.unlocked
                        ? "2px solid var(--primary-blue)"
                        : "1px dashed var(--border-color)",
                      opacity: ach.unlocked ? 1 : 0.6,
                      transition: "all 0.3s ease",
                      cursor: ach.unlocked ? "pointer" : "default",
                    }}
                  >
                    <div
                      className="ach-icon-circle"
                      style={{ fontSize: "3rem", marginBottom: "1rem" }}
                    >
                      {ach.unlocked ? ach.icon : "🔒"}
                    </div>
                    <h3 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>
                      {ach.name}
                    </h3>
                    <p
                      style={{ fontSize: "0.85rem", color: "var(--text-sub)" }}
                    >
                      {ach.threshold.toLocaleString()} XP Points
                    </p>
                    {ach.unlocked ? (
                      <span
                        className="unlocked-badge"
                        style={{
                          background: "#dcfce7",
                          color: "#166534",
                          padding: "0.2rem 0.6rem",
                          borderRadius: "100px",
                          fontSize: "0.7rem",
                          fontWeight: "800",
                          marginTop: "1rem",
                          display: "inline-block",
                        }}
                      >
                        UNLOCKED
                      </span>
                    ) : (
                      <span
                        className="locked-badge"
                        style={{
                          background: "#f1f5f9",
                          color: "#64748b",
                          padding: "0.2rem 0.6rem",
                          borderRadius: "100px",
                          fontSize: "0.7rem",
                          fontWeight: "800",
                          marginTop: "1rem",
                          display: "inline-block",
                        }}
                      >
                        LOCKED
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <h2 className="section-title" style={{ marginTop: "4rem" }}>
                Badge Showcase
              </h2>
              <div
                className="badge-showcase-premium"
                style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}
              >
                {(user?.Lms_badges || "")
                  .split(",")
                  .filter(Boolean)
                  .map((b, i) => (
                    <span
                      key={i}
                      className="badge-item-premium"
                      style={{
                        background: "var(--gradient-blue)",
                        color: "white",
                        padding: "0.5rem 1.5rem",
                        borderRadius: "100px",
                        fontWeight: "700",
                        fontSize: "0.9rem",
                        boxShadow: "0 4px 12px rgba(249, 115, 22, 0.3)",
                      }}
                    >
                      {b}
                    </span>
                  ))}
                {!user?.Lms_badges && (
                  <p style={{ color: "var(--text-sub)" }}>
                    No community badges earned yet. Complete assignments to earn
                    them!
                  </p>
                )}
              </div>
            </section>
          </div>
        );
      case "Certifications":
        return (
          <div className="edu-content-scroll">
            <section className="edu-section premium-padding">
              <h2 className="section-title">
                Academic Achievements & Certificates
              </h2>
              <p
                style={{
                  color: "var(--text-sub)",
                  marginBottom: "2.5rem",
                  fontSize: "0.95rem",
                }}
              >
                Verified certificates represent 100% curriculum completion and
                skill mastery.
              </p>

              {enrolledCourses && enrolledCourses.length > 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "3rem",
                  }}
                >
                  {/* --- EARNED CERTIFICATES --- */}
                  <div>
                    <h3
                      style={{
                        fontSize: "1.1rem",
                        color: "var(--primary-blue)",
                        fontWeight: "800",
                        marginBottom: "1.5rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <FiAward /> Earned Certificates (
                      {
                        enrolledCourses.filter(
                          (c) => Math.round(c.progress_pct) >= 100,
                        ).length
                      }
                      )
                    </h3>
                    <div
                      className="certs-grid"
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fill, minmax(350px, 1fr))",
                        gap: "2rem",
                      }}
                    >
                      {enrolledCourses
                        .filter((c) => Math.round(c.progress_pct) >= 100)
                        .map((course) => (
                          <div
                            className="cert-card-premium"
                            key={course.id}
                            style={{
                              background: "var(--card-bg)",
                              border: "1px solid var(--border-color)",
                              borderRadius: "2rem",
                              padding: 0,
                              position: "relative",
                              overflow: "hidden",
                              boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
                            }}
                          >
                            <div
                              style={{
                                height: "140px",
                                background: "var(--gradient-blue)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "white",
                                position: "relative",
                              }}
                            >
                              <div
                                style={{
                                  position: "absolute",
                                  bottom: "1rem",
                                  right: "1rem",
                                  background: "rgba(255,255,255,0.2)",
                                  padding: "4px 12px",
                                  borderRadius: "100px",
                                  fontSize: "0.7rem",
                                  fontWeight: "800",
                                }}
                              >
                                VERIFIED
                              </div>
                            </div>

                            <div style={{ padding: "2rem" }}>
                              <h3
                                style={{
                                  margin: 0,
                                  fontSize: "1.2rem",
                                  fontWeight: "900",
                                  color: "var(--text-main)",
                                }}
                              >
                                {course.title}
                              </h3>
                              <p
                                style={{
                                  fontSize: "0.85rem",
                                  color: "var(--text-sub)",
                                  marginTop: "0.5rem",
                                }}
                              >
                                Professional Certification of Achievement
                              </p>

                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  margin: "1.5rem 0",
                                  borderTop: "1px solid var(--border-color)",
                                  paddingTop: "1rem",
                                }}
                              >
                                <div>
                                  <span
                                    style={{
                                      fontSize: "0.65rem",
                                      color: "var(--text-sub)",
                                      display: "block",
                                    }}
                                  >
                                    ISSUED ON
                                  </span>
                                  <span
                                    style={{
                                      fontSize: "0.85rem",
                                      fontWeight: "600",
                                    }}
                                  >
                                    {new Date().toLocaleDateString()}
                                  </span>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                  <span
                                    style={{
                                      fontSize: "0.65rem",
                                      color: "var(--text-sub)",
                                      display: "block",
                                    }}
                                  >
                                    CERTIFICATE ID
                                  </span>
                                  <span
                                    style={{
                                      fontSize: "0.85rem",
                                      fontWeight: "600",
                                    }}
                                  >
                                    CERT-{course.id}-{user?.id || "LMS"}
                                  </span>
                                </div>
                              </div>

                              <div style={{ display: "flex", gap: "1rem" }}>
                                <button
                                  onClick={() => handleViewCertificate(course)}
                                  style={{
                                    flex: 1,
                                    padding: "0.9rem",
                                    background: "var(--primary-blue)",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "1.2rem",
                                    fontWeight: "800",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "8px",
                                    transition: "transform 0.2s",
                                  }}
                                  onMouseOver={(e) =>
                                  (e.currentTarget.style.transform =
                                    "scale(1.02)")
                                  }
                                  onMouseOut={(e) =>
                                  (e.currentTarget.style.transform =
                                    "scale(1)")
                                  }
                                >
                                  <FiAward /> View Certificate
                                </button>

                                {/* --- HIDDEN CERTIFICATE TEMPLATE FOR CAPTURE --- */}
                                <div
                                  id={`cert-template-${course.id}`}
                                  style={{
                                    display: "none",
                                    width: "1000px",
                                    height: "700px",
                                    position: "relative",
                                    fontFamily: "'Outfit', sans-serif",
                                    textAlign: "center",
                                    color: "#111",
                                    overflow: "hidden",
                                    background: "#fff"
                                  }}
                                >
                                  {/* Base Template Image */}
                                  <img 
                                    src="/Certificate_Template.png" 
                                    alt="Template" 
                                    style={{
                                      position: "absolute",
                                      top: 0,
                                      left: 0,
                                      width: "1000px",
                                      height: "700px",
                                      objectFit: "cover",
                                      zIndex: 1
                                    }}
                                  />

                                  {/* Overlay Content */}
                                  <div style={{ position: "relative", zIndex: 10, height: "100%" }}>
                                    {/* learner Name */}
                                    <div
                                      style={{
                                        position: "absolute",
                                        top: "280px",
                                        left: "63%",
                                        transform: "translateX(-50%)",
                                        width: "600px",
                                        fontSize: "48px",
                                        fontWeight: "900",
                                        color: "#f97316",
                                        textTransform: "uppercase",
                                        fontFamily: "'Georgia', serif",
                                        letterSpacing: "1px",
                                      }}
                                    >
                                      {user?.Lms_full_name || "VALUED LEARNER"}
                                    </div>

                                    {/* Message */}
                                    <div
                                      style={{
                                        position: "absolute",
                                        top: "360px",
                                        left: "63%",
                                        transform: "translateX(-50%)",
                                        width: "550px",
                                        fontSize: "15px",
                                        fontWeight: "500",
                                        color: "#475569",
                                        fontStyle: "italic",
                                        lineHeight: "1.4",
                                      }}
                                    >
                                      For successfully completing the comprehensive training program<br />
                                      and demonstrating exceptional proficiency in
                                    </div>

                                    {/* Course Title */}
                                    <div
                                      style={{
                                        position: "absolute",
                                        top: "430px",
                                        left: "63%",
                                        transform: "translateX(-50%)",
                                        width: "550px",
                                        fontSize: "30px",
                                        fontWeight: "800",
                                        color: "#0f172a",
                                        lineHeight: "1.2",
                                        fontFamily: "'Outfit', sans-serif",
                                      }}
                                    >
                                      {course.title}
                                    </div>

                                    {/* Metadata Footer */}
                                    <div
                                      style={{
                                        position: "absolute",
                                        bottom: "165px",
                                        left: "400px",
                                        width: "200px",
                                        fontSize: "16px",
                                        fontWeight: "800",
                                        color: "#1e293b",
                                      }}
                                    >
                                      {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                      <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", fontWeight: "600", textTransform: 'uppercase' }}>Date Issued</div>
                                    </div>

                                    <div
                                      style={{
                                        position: "absolute",
                                        bottom: "165px",
                                        right: "80px",
                                        width: "220px",
                                        fontSize: "22px",
                                        fontWeight: "900",
                                        color: "#1e1e1e",
                                        fontFamily: "'Dancing Script', cursive, serif"
                                      }}
                                    >
                                      Amit Kumar
                                      <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", fontWeight: "600", fontFamily: "'Outfit', sans-serif", textTransform: 'uppercase' }}>Platform Director</div>
                                    </div>

                                    {/* Verification Stamp */}
                                    <div
                                      style={{
                                        position: "absolute",
                                        bottom: "85px",
                                        left: "63%",
                                        transform: "translateX(-50%)",
                                        fontSize: "9px",
                                        color: "rgba(0,0,0,0.4)",
                                        letterSpacing: "0.1em",
                                        fontWeight: "700",
                                      }}
                                    >
                                      VERIFICATION ID: CERT-{course.id}-{user?.id || "LE"} • OGES ACADEMIC RECOGNITION
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      {enrolledCourses.filter(
                        (c) => Math.round(c.progress_pct) >= 100,
                      ).length === 0 && (
                          <div
                            style={{
                              gridColumn: "1 / -1",
                              padding: "3rem",
                              textAlign: "center",
                              background: "rgba(0,0,0,0.02)",
                              borderRadius: "1.5rem",
                              border: "1px dashed var(--border-color)",
                            }}
                          >
                            <p style={{ color: "var(--text-sub)" }}>
                              You haven't earned any certificates yet. Complete a
                              module 100% to unlock your credential.
                            </p>
                          </div>
                        )}
                    </div>
                  </div>

                  {/* --- ACTIVE TRACKS --- */}
                  <div>
                    <h3
                      style={{
                        fontSize: "1.1rem",
                        color: "var(--text-sub)",
                        fontWeight: "800",
                        marginBottom: "1.5rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <FiClock /> Available Learning Tracks (
                      {
                        enrolledCourses.filter(
                          (c) => Math.round(c.progress_pct) < 100,
                        ).length
                      }
                      )
                    </h3>
                    <div
                      className="active-tracks-grid"
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fill, minmax(350px, 1fr))",
                        gap: "2rem",
                      }}
                    >
                      {enrolledCourses
                        .filter((c) => Math.round(c.progress_pct) < 100)
                        .map((course) => (
                          <div
                            className="track-card-mini"
                            key={course.id}
                            style={{
                              background: "var(--card-bg)",
                              border: "1px solid var(--border-color)",
                              borderRadius: "1.5rem",
                              padding: "1.5rem",
                              display: "flex",
                              flexDirection: "column",
                              gap: "1rem",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <h4 style={{ margin: 0, fontSize: "1rem" }}>
                                {course.title}
                              </h4>
                              <div
                                style={{
                                  background: "rgba(59,130,246,0.1)",
                                  color: "var(--primary-blue)",
                                  padding: "2px 10px",
                                  borderRadius: "100px",
                                  fontSize: "0.7rem",
                                  fontWeight: "800",
                                }}
                              >
                                {Math.round(course.progress_pct)}% Done
                              </div>
                            </div>
                            <div
                              className="progress-track-full"
                              style={{
                                height: "6px",
                                background: "var(--border-color)",
                                borderRadius: "3px",
                              }}
                            >
                              <div
                                style={{
                                  width: `${course.progress_pct}%`,
                                  height: "100%",
                                  background: "var(--primary-blue)",
                                  borderRadius: "3px",
                                }}
                              ></div>
                            </div>
                            <button
                              onClick={() => navigate(`/player/${course.id}`)}
                              style={{
                                width: "100%",
                                padding: "0.7rem",
                                background: "transparent",
                                color: "var(--primary-blue)",
                                border: "1px solid var(--primary-blue)",
                                borderRadius: "0.8rem",
                                fontWeight: "700",
                                cursor: "pointer",
                                fontSize: "0.85rem",
                              }}
                            >
                              Continue Learning →
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="edu-placeholder-view">
                  <div className="placeholder-icon-lg">
                    <FiAward style={{ opacity: 0.2 }} size={64} />
                  </div>
                  <h3>No Certifications Available</h3>
                  <p>
                    Your earned certificates will appear here once you finish a
                    module 100%.
                  </p>
                </div>
              )}
            </section>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="edu-dashboard">
      <aside className="edu-sidebar">
        <div
          className="sidebar-header"
          onClick={() => onHomeClick("/")}
          style={{ cursor: "pointer" }}
        >
          <span className="edu-logo"> Learner 🎓</span>
        </div>
        <nav className="sidebar-nav">
          {[
            { name: "Dashboard", icon: <FiHome /> },
            { name: "My Training", icon: <FiBookOpen /> },
            { name: "Assignments", icon: <FiFileText /> },
            { name: "Quizzes", icon: <FiActivity /> },
            { name: "Achievements", icon: <FiStar /> },
            { name: "Certifications", icon: <FiAward /> },
            { name: "Profile", icon: <FiUser />, action: onProfileClick },
            {
              name: isDarkMode ? "Light Mode" : "Dark Mode",
              icon: isDarkMode ? <FiSun /> : <FiMoon />,
              action: onToggleTheme,
            },
          ].map((item) => (
            <button
              key={item.name}
              className={`sidebar-link ${currentTab === item.name ? "active" : ""}`}
              onClick={() =>
                item.action ? item.action() : setCurrentTab(item.name)
              }
            >
              <span style={{ marginRight: "12px" }}>{item.icon}</span>
              {item.name}
            </button>
          ))}
        </nav>
        <button
          className="sidebar-logout"
          onClick={onLogout}
          style={{ marginTop: "auto" }}
        >
          <FiLogOut style={{ marginRight: "12px" }} /> Logout
        </button>
        <div
          style={{
            padding: "20px",
            fontSize: "0.8rem",
            color: "var(--text-sub)",
            borderTop: "1px solid var(--border-color)",
            marginTop: "20px",
          }}
        ></div>
      </aside>

      <main className="edu-main">{renderTabContent()}</main>
    </div>
  );
};

export default Dashboard;

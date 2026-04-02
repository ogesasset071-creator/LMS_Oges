import React, { useState, useEffect } from "react";
import "./Home.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import {
  FiBookOpen,
  FiSearch,
  FiLock,
  FiCheck,
  FiChevronRight,
} from "react-icons/fi";

// ── Category → Course Roadmap Mapping ──
// Each category maps to a course title with chapters split into levels
const CATEGORY_ROADMAPS = {
  "Frontend Development": {
    courseTitle: "Frontend Development",
    icon: "🎨",
    levels: [
      { name: "Level 1 — Beginner", chapters: ["HTML, CSS, JavaScript"] },
      {
        name: "Level 2 — Intermediate",
        chapters: ["Angular / React, APIs, Tailwind"],
      },
      {
        name: "Level 3 — Advanced",
        chapters: ["Optimization, SSR, State Management"],
      },
    ],
  },
  "Backend Development": {
    courseTitle: "Backend Development",
    icon: "⚙️",
    levels: [
      {
        name: "Level 1 — Beginner",
        chapters: ["Node.js / Java / Python Basics"],
      },
      {
        name: "Level 2 — Intermediate",
        chapters: ["REST APIs, Auth, DB Integration"],
      },
      {
        name: "Level 3 — Advanced",
        chapters: ["Microservices, System Design"],
      },
    ],
  },
  "Full Stack Development": {
    courseTitle: "Full Stack Development",
    icon: "🌐",
    levels: [
      { name: "Level 1 — Beginner", chapters: ["Frontend + Backend Basics"] },
      { name: "Level 2 — Intermediate", chapters: ["MERN / MEAN Stack"] },
      { name: "Level 3 — Advanced", chapters: ["Deployment, Scaling"] },
    ],
  },
  "Data Science": {
    courseTitle: "Data Science",
    icon: "📊",
    levels: [
      { name: "Level 1 — Beginner", chapters: ["Python, Statistics"] },
      { name: "Level 2 — Intermediate", chapters: ["Pandas, Visualization"] },
      { name: "Level 3 — Advanced", chapters: ["ML Models"] },
    ],
  },
  "Data Analytics": {
    courseTitle: "Data Analytics",
    icon: "📈",
    levels: [
      { name: "Level 1 — Beginner", chapters: ["Excel, Data Cleaning"] },
      { name: "Level 2 — Intermediate", chapters: ["SQL, Power BI"] },
      { name: "Level 3 — Advanced", chapters: ["Dashboarding, BI"] },
    ],
  },
  "Artificial Intelligence": {
    courseTitle: "Artificial Intelligence",
    icon: "🤖",
    levels: [
      { name: "Level 1 — Beginner", chapters: ["AI Basics"] },
      { name: "Level 2 — Intermediate", chapters: ["ML Algorithms"] },
      { name: "Level 3 — Advanced", chapters: ["Deep Learning, GenAI"] },
    ],
  },
  "Machine Learning": {
    courseTitle: "Machine Learning",
    icon: "🧠",
    levels: [
      { name: "Level 1 — Beginner", chapters: ["Python ML Basics"] },
      {
        name: "Level 2 — Intermediate",
        chapters: ["Supervised/Unsupervised Learning"],
      },
      { name: "Level 3 — Advanced", chapters: ["Model Tuning, Deployment"] },
    ],
  },
  "Cloud Computing": {
    courseTitle: "Cloud Computing",
    icon: "☁️",
    levels: [
      { name: "Level 1 — Beginner", chapters: ["AWS / Azure Basics"] },
      { name: "Level 2 — Intermediate", chapters: ["Storage, Networking"] },
      { name: "Level 3 — Advanced", chapters: ["Architecture, Serverless"] },
    ],
  },
  DevOps: {
    courseTitle: "DevOps",
    icon: "♾️",
    levels: [
      { name: "Level 1 — Beginner", chapters: ["Linux, Git"] },
      { name: "Level 2 — Intermediate", chapters: ["Docker, CI/CD"] },
      { name: "Level 3 — Advanced", chapters: ["Advanced Kubernetes, IaC"] },
    ],
  },
  "Cyber Security": {
    courseTitle: "Cyber Security",
    icon: "🔒",
    levels: [
      { name: "Level 1 — Beginner", chapters: ["Networking, Security Basics"] },
      { name: "Level 2 — Intermediate", chapters: ["Ethical Hacking"] },
      { name: "Level 3 — Advanced", chapters: ["Penetration Testing"] },
    ],
  },
  "Mobile App Development": {
    courseTitle: "Mobile App Development",
    icon: "📱",
    levels: [
      { name: "Level 1 — Beginner", chapters: ["Programming Basics"] },
      { name: "Level 2 — Intermediate", chapters: ["Flutter / React Native"] },
      { name: "Level 3 — Advanced", chapters: ["App Deployment"] },
    ],
  },
  "UI/UX Design": {
    courseTitle: "UI/UX Design",
    icon: "🎨",
    levels: [
      { name: "Level 1 — Beginner", chapters: ["Design Principles"] },
      { name: "Level 2 — Intermediate", chapters: ["Figma, Prototyping"] },
      { name: "Level 3 — Advanced", chapters: ["Design Systems Architecture"] },
    ],
  },
  "Database Management": {
    courseTitle: "Database Management",
    icon: "🖥️",
    levels: [
      { name: "Level 1 — Beginner", chapters: ["SQL Basics"] },
      { name: "Level 2 — Intermediate", chapters: ["Joins, Indexing"] },
      {
        name: "Level 3 — Advanced",
        chapters: ["Database Optimization, Scaling"],
      },
    ],
  },
  "Software Testing": {
    courseTitle: "Software Testing",
    icon: "🧪",
    levels: [
      { name: "Level 1 — Beginner", chapters: ["Manual Testing"] },
      { name: "Level 2 — Intermediate", chapters: ["Automation (Selenium)"] },
      { name: "Level 3 — Advanced", chapters: ["Performance Testing & CI"] },
    ],
  },
  "Game Development": {
    courseTitle: "Game Development",
    icon: "🎮",
    levels: [
      { name: "Level 1 — Beginner", chapters: ["Unity Basics"] },
      { name: "Level 2 — Intermediate", chapters: ["Game Physics"] },
      { name: "Level 3 — Advanced", chapters: ["Multiplayer Systems"] },
    ],
  },
  "Blockchain Development": {
    courseTitle: "Blockchain Development",
    icon: "⛓️",
    levels: [
      { name: "Level 1 — Beginner", chapters: ["Blockchain Basics"] },
      { name: "Level 2 — Intermediate", chapters: ["Smart Contracts"] },
      { name: "Level 3 — Advanced", chapters: ["DApps, Web3 Ecosystem"] },
    ],
  },
  "Internet of Things (IoT)": {
    courseTitle: "Internet of Things (IoT)",
    icon: "📡",
    levels: [
      { name: "Level 1 — Beginner", chapters: ["Sensors & Basics"] },
      {
        name: "Level 2 — Intermediate",
        chapters: ["Microcontrollers & Protocols"],
      },
      { name: "Level 3 — Advanced", chapters: ["Advanced IoT Systems"] },
    ],
  },
  "AR/VR Development": {
    courseTitle: "AR/VR Development",
    icon: "🥽",
    levels: [
      { name: "Level 1 — Beginner", chapters: ["AR/VR Foundations"] },
      { name: "Level 2 — Intermediate", chapters: ["Unity AR Tools"] },
      { name: "Level 3 — Advanced", chapters: ["Immersive Applications"] },
    ],
  },
  Networking: {
    courseTitle: "Networking",
    icon: "🌐",
    levels: [
      { name: "Level 1 — Beginner", chapters: ["Fundamental Network Basics"] },
      { name: "Level 2 — Intermediate", chapters: ["Routing & Switching"] },
      {
        name: "Level 3 — Advanced",
        chapters: ["Network Security & Architecture"],
      },
    ],
  },
  "System Design": {
    courseTitle: "System Design",
    icon: "🏗️",
    levels: [
      { name: "Level 1 — Beginner", chapters: ["Basics of Architecture"] },
      { name: "Level 2 — Intermediate", chapters: ["Design Patterns"] },
      { name: "Level 3 — Advanced", chapters: ["Scalable High-Load Systems"] },
    ],
  },
  "Oil and Gas": {
    courseTitle: "Oil and Gas",
    icon: "🛢️",
    levels: [
      { name: "Level 1 — Beginner", chapters: ["Petroleum Engineering Basics"] },
      { name: "Level 2 — Intermediate", chapters: ["Drilling & Production"] },
      { name: "Level 3 — Advanced", chapters: ["Reservoir Simulation, Offshore Tech"] },
    ],
  },
  SaaS: {
    courseTitle: "SaaS",
    icon: "🚀",
    levels: [
      { name: "Level 1 — Beginner", chapters: ["Cloud Delivery Models"] },
      { name: "Level 2 — Intermediate", chapters: ["Multi-tenancy Architecture"] },
      { name: "Level 3 — Advanced", chapters: ["SaaS Business & Scaling"] },
    ],
  },
};

const Home = (props) => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState("All");
  const [activeLevel, setActiveLevel] = useState("All");
  const [loading, setLoading] = useState(true);
  const [searchQuery] = useState("");

  const levelOptions = ["All", "Beginner", "Intermediate", "Advanced"];
  const [stats, setStats] = useState({
    courses: 0,
    students: 0,
    instructors: 0,
  });
  const [eduCourses, setEduCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [matchedCourse, setMatchedCourse] = useState(null); // The course object matching user's category

  const userCategory = props.user?.Lms_category || "";
  // Fuzzy match category against roadmap keys
  const roadmapKey = Object.keys(CATEGORY_ROADMAPS).find((k) => {
    if (!userCategory) return false;
    const u = userCategory.toLowerCase();
    const r = k.toLowerCase();
    return u === r || u.includes(r) || r.includes(u);
  });
  const roadmap = roadmapKey ? CATEGORY_ROADMAPS[roadmapKey] : null;

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        // Fetch a larger set for the main grid to ensure variety
        const res = await api.get("/courses?limit=100");
        const courseList = res.data.courses || [];
        setCourses(courseList);

        const uniqueCats = [
          "All",
          ...new Set(courseList.map((c) => c.category)),
        ];
        setCategories(uniqueCats);
        setStats((prev) => ({
          ...prev,
          courses: res.data.total || courseList.length,
        }));

        // Find the course matching user's category roadmap (fuzzy match title)
        if (roadmap) {
          const found = courseList.find((c) => {
            const title = c.title.toLowerCase();
            const target = roadmap.courseTitle.toLowerCase();
            return title.includes(target) || target.includes(title);
          });
          setMatchedCourse(found || null);
        }
      } catch (e) {
        console.error("Error fetching courses", e);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };
    const fetchData = async () => {
      if (props.isLoggedIn) {
        if (props.user?.Lms_role === "admin") {
          try {
            const res = await api.get("/admin/courses");
            setEduCourses(res.data);
          } catch (e) {
            console.error(e);
          }
        }
        if (props.user?.Lms_role === "learner") {
          try {
            const res = await api.get("/user/courses");
            setEnrolledCourses(res.data);
          } catch (e) {
            console.error(e);
          }
        }
      }
    };
    fetchCourses();
    fetchData();
  }, [props.isLoggedIn, props.user, roadmap]);

  const filteredCourses = (Array.isArray(courses) ? courses : []).filter(
    (c) => {
      const matchesTab = activeTab === "All" || c.category === activeTab;
      const matchesLevel =
        activeLevel === "All" ||
        (c.level && c.level.toLowerCase() === activeLevel.toLowerCase());
      const matchesSearch = c.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      return matchesTab && matchesLevel && matchesSearch;
    },
  );

  return (
    <div className="home-udemy-style">
      {/* --- HERO --- */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-text-side">
            <span className="hero-badge">Internal Training Portal</span>
            <h1>
              Master New Skills with{" "}
              <span className="hero-gradient-text">Company Training</span>
            </h1>
            <p className="hero-subtitle">
              Learn from internal experts and industry leads. Comprehensive
              onboarding and upskilling for our team.
            </p>
          </div>
          <div className="hero-visual-side">
            <div className="hero-illustration">
              <div className="hero-code-block">
                <div className="code-dots">
                  <div className="dot red"></div>
                  <div className="dot yellow"></div>
                  <div className="dot green"></div>
                </div>
                <pre>
                  <code>{`class Intern:
  def __init__(self, name):
    self.name = name
    self.skill_level = "Beginner"

  def upskill(self):
    self.skill_level = "Expert"
    print(f"{self.name} is growing!")`}</code>
                </pre>
              </div>
            </div>
            <div className="hero-stats-floating">
              <div className="floating-stat-card fs-1">
                <span className="fs-number">{stats.courses}+</span>
                <span className="fs-label">Modules</span>
              </div>
              <div className="floating-stat-card fs-2">
                <span className="fs-number">Active</span>
                <span className="fs-label">Community</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="courses-section">
        <div className="courses-container">
          {/* ════════════ 1. RECOMMENDED FOR YOU (ALWAYS ON TOP) ════════════ */}
          {props.isLoggedIn && props.user?.Lms_role === "learner" && (
            <div
              className="recommended-section-home"
              style={{ marginBottom: "3.5rem" }}
            >
              <div className="section-header-home">
                <div>
                  <h2
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <span style={{ fontSize: "1.5rem" }}>✨</span> Recommended
                    for your track: {props.user?.Lms_category || "Trainee"}
                  </h2>
                  <p className="section-sub">
                    Training modules tailored to your internal role.
                  </p>
                </div>
                {props.user?.Lms_category && (
                  <button
                    className="view-all-btn"
                    onClick={() => {
                      setActiveTab(props.user.Lms_category);
                      const el = document.getElementById("all-tracks-grid");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    Explore more in {props.user.Lms_category} →
                  </button>
                )}
              </div>
              <div className="course-grid-home">
                {(courses || [])
                  .filter((c) => {
                    if (!props.user?.Lms_category) return false;
                    const uCat = props.user.Lms_category.toLowerCase().trim();
                    const cCat = (c.category || "").toLowerCase().trim();
                    return (
                      cCat === uCat ||
                      cCat.includes(uCat) ||
                      uCat.includes(cCat)
                    );
                  })
                  .slice(0, 4)
                  .map((course) => {
                    const cLvl = (course.level || "Beginner").toLowerCase();
                    const userPP = props.user?.Lms_pp || 0;

                    let isLocked = false;
                    if (cLvl === "intermediate") {
                      isLocked = userPP < 2000;
                    } else if (cLvl === "advanced") {
                      isLocked = userPP < 4000;
                    }

                    return (
                      <div
                        className={`course-card-home ${isLocked ? "locked-course" : ""}`}
                        key={course.id}
                        onClick={() =>
                          !isLocked && navigate(`/player/${course.id}`)
                        }
                        style={{
                          position: "relative",
                          cursor: isLocked ? "not-allowed" : "pointer",
                        }}
                      >
                        {isLocked && (
                          <div
                            className="course-lock-overlay"
                            style={{
                              position: "absolute",
                              inset: 0,
                              background: "rgba(var(--bg-rgb), 0.8)",
                              backdropFilter: "blur(4px)",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              zIndex: 10,
                              borderRadius: "1.2rem",
                              padding: "1rem",
                              textAlign: "center",
                              border: "1px solid var(--border-color)",
                            }}
                          >
                            <FiLock
                              size={28}
                              style={{
                                color: "var(--primary-blue)",
                                marginBottom: "0.75rem",
                              }}
                            />
                            {/* <span style={{fontSize: '0.9rem', fontWeight: '900', color: 'var(--text-main)', letterSpacing: '0.05em'}}>LOCKED — {reqPP} PP</span> */}
                          </div>
                        )}
                        <div className="course-thumb-home">
                          <img
                            src={
                              course.thumbnail ||
                              "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400"
                            }
                            alt={course.title}
                            onError={(e) => {
                              e.target.src =
                                "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400";
                            }}
                          />
                        </div>
                        <div className="course-body-home">
                          <h4 className="course-title-home">{course.title}</h4>
                          <p className="course-instructor-home">
                            {course.tutor_name || "Internal Expert"}
                          </p>
                          <div className="course-meta-home">
                            <span className="chapter-count">
                              {course.chapters?.length || 0} lessons
                            </span>
                          </div>
                          <div className="course-footer-badges">
                            <span className="course-cat-badge">
                              {course.category}
                            </span>
                            <span className="course-level-badge">
                              {course.level || "Beginner"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                {(courses || []).filter((c) => {
                  if (!props.user?.Lms_category) return false;
                  const uCat2 = props.user.Lms_category.toLowerCase().trim();
                  const cCat2 = (c.category || "").toLowerCase().trim();
                  return (
                    cCat2 === uCat2 ||
                    cCat2.includes(uCat2) ||
                    uCat2.includes(cCat2)
                  );
                }).length === 0 && (
                    <div
                      className="no-roadmap-courses"
                      style={{
                        gridColumn: "1 / -1",
                        padding: "3rem",
                        textAlign: "center",
                        background: "#f8fafc",
                        borderRadius: "1.5rem",
                        border: "1px dashed #e2e8f0",
                      }}
                    >
                      <p style={{ color: "var(--text-sub)" }}>
                        No specific modules for{" "}
                        <strong>{props.user?.Lms_category || "your track"}</strong>{" "}
                        yet. Check back later!
                      </p>
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* ════════════ 2. ROADMAP SECTION ════════════ */}
          {props.isLoggedIn && props.user?.Lms_role === "learner" && roadmap && (
            <div className="roadmap-section">
              <div className="section-header-home">
                <div>
                  <h2>
                    {roadmap.icon} Your {userCategory} Roadmap
                  </h2>
                  <p className="section-sub">
                    Follow the levels to master {userCategory} step by step.
                  </p>
                </div>
                {matchedCourse && (
                  <button
                    className="view-all-btn"
                    onClick={() => navigate(`/player/${matchedCourse.id}`)}
                  >
                    Open Full Course →
                  </button>
                )}
              </div>

              <div className="roadmap-horizontal-flex">
                {roadmap.levels.map((level, levelIdx) => {
                  // Unlock logic based on PP points (2000 for level 2, 4000 for level 3)
                  let isUnlocked = levelIdx === 0;
                  if (levelIdx === 1)
                    isUnlocked = (props.user?.Lms_pp || 0) >= 2000;
                  if (levelIdx === 2)
                    isUnlocked = (props.user?.Lms_pp || 0) >= 4000;

                  const thisLevelDone = level.chapters.every((ch) => {
                    const chObj = matchedCourse?.chapters?.find(
                      (c) =>
                        c.title.toLowerCase().includes(ch.toLowerCase()) ||
                        ch.toLowerCase().includes(c.title.toLowerCase()),
                    );
                    return chObj?.completed;
                  });
                  const isCurrent = isUnlocked && !thisLevelDone;

                  return (
                    <div
                      className={`roadmap-step-col ${isUnlocked ? "unlocked" : "locked"} ${isCurrent ? "active" : ""}`}
                      key={levelIdx}
                    >
                      <div className="step-indicator">
                        <div className={`step-badge level-${levelIdx + 1}`}>
                          {isUnlocked ? (
                            thisLevelDone ? (
                              <FiCheck />
                            ) : (
                              levelIdx + 1
                            )
                          ) : (
                            <FiLock />
                          )}
                        </div>
                        {levelIdx < roadmap.levels.length - 1 && (
                          <div className="step-line-h"></div>
                        )}
                      </div>
                      <div className="step-content-h">
                        <h4>{level.name}</h4>
                        <div className="mini-chapters-h">
                          {level.chapters.map((ch, chIdx) => {
                            const chObj = matchedCourse?.chapters?.find(
                              (c) =>
                                c.title
                                  .toLowerCase()
                                  .includes(ch.toLowerCase()) ||
                                ch
                                  .toLowerCase()
                                  .includes(c.title.toLowerCase()),
                            );
                            return (
                              <div
                                key={chIdx}
                                className={`mini-ch-item ${chObj?.completed ? "done" : ""}`}
                                style={{
                                  cursor: matchedCourse ? "pointer" : "default",
                                }}
                                onClick={() =>
                                  matchedCourse &&
                                  props.onHomeClick(
                                    `/player/${matchedCourse.id}`,
                                  )
                                }
                              >
                                {chObj?.completed ? (
                                  <FiCheckCircle />
                                ) : (
                                  <FiBookOpen />
                                )}{" "}
                                <span>{ch}</span>
                                {!chObj?.completed && matchedCourse && (
                                  <span
                                    style={{
                                      marginLeft: "auto",
                                      fontSize: "0.7rem",
                                      color: "var(--primary-blue)",
                                      fontWeight: "700",
                                    }}
                                  >
                                    Start →
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        {isCurrent && (
                          <span className="current-badge-h">Current</span>
                        )}
                        {thisLevelDone && (
                          <span className="done-badge-h">Mastered</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ════════════ ADMIN COURSES ════════════ */}
          {eduCourses.length > 0 && (
            <div className="edu-personal-section">
              <div className="section-header-home">
                <h2>Your Admin Library</h2>
                <button
                  className="view-all-btn"
                  onClick={() => navigate("/admin")}
                >
                  Manage All →
                </button>
              </div>
              <div className="course-grid-home">
                {eduCourses.slice(0, 4).map((course) => (
                  <div
                    className="course-card-home"
                    key={course.id}
                    onClick={() => navigate(`/player/${course.id}`)}
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
                    <div className="course-body-home">
                      <h4 className="course-title-home">{course.title}</h4>
                      <div className="course-footer-badges">
                        <span className="course-cat-badge">
                          {course.category}
                        </span>
                        <span className="course-level-badge">
                          {course.level || "Beginner"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════════════ FEATURED: SAAS & OIL AND GAS ════════════ */}
          <div className="energy-saas-featured-section" style={{ marginBottom: '4rem', marginTop: '2rem' }}>
            <div className="section-header-home" style={{ borderLeft: '4px solid #fbcb0e', paddingLeft: '1.2rem' }}>
              <div>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ fontSize: '1.6rem' }}>⛽</span> Featured: SaaS & Oil and Gas
                </h2>
                <p className="section-sub">
                  Strategic training modules for energy digitalization and cloud-native solutions.
                </p>
              </div>
              <button
                className="view-all-btn"
                onClick={() => {
                  setActiveTab("Oil and Gas");
                  const el = document.getElementById("all-tracks-grid");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
              >
                View Energy Modules →
              </button>
            </div>
            <div className="course-grid-home">
              {(courses || [])
                .filter((c) => {
                  const cat = (c.category || "").toLowerCase();
                  return cat.includes("oil") || cat.includes("gas") || cat.includes("saas");
                })
                .slice(0, 4)
                .map((course) => (
                  <div
                    className="course-card-home"
                    key={course.id}
                    onClick={() => navigate(`/player/${course.id}`)}
                  >
                    <div className="course-thumb-home">
                      <img
                        src={
                          course.thumbnail ||
                          "https://images.unsplash.com/photo-1518364538800-6da291ed79a5?w=400"
                        }
                        alt={course.title}
                        onError={(e) => {
                          e.target.src =
                          "https://images.unsplash.com/photo-1518364538800-6da291ed79a5?w=400";
                        }}
                      />
                    </div>
                    <div className="course-body-home">
                      <h4 className="course-title-home">{course.title}</h4>
                      <p className="course-instructor-home">
                        {course.tutor_name || "Enterprise Expert"}
                      </p>
                      <div className="course-meta-home">
                        <span>{course.level || "Specialized"}</span>
                      </div>
                      <div className="course-footer-badges">
                        <span className="course-cat-badge">{course.category}</span>
                        {course.required_pp > 0 && (
                          <span className="course-pp-badge">Target: {course.required_pp} PP</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              {(courses || []).filter((c) => {
                  const cat = (c.category || "").toLowerCase();
                  return cat.includes("oil") || cat.includes("gas") || cat.includes("saas");
                }).length === 0 && (
                <div style={{ gridColumn: '1 / -1', padding: '2rem', textAlign: 'center', background: 'rgba(251, 203, 14, 0.05)', borderRadius: '1rem', border: '1px dashed #fbcb0e' }}>
                  <p style={{ color: 'var(--text-sub)' }}>No featured modules in this category yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* ════════════ CONTINUE TRAINING ════════════ */}
          {enrolledCourses.length > 0 && (
            <div className="student-personal-section">
              <div className="section-header-home">
                <h2>Continue Your Training</h2>
                <button
                  className="view-all-btn"
                  onClick={() => navigate("/dashboard")}
                >
                  Go to Dashboard →
                </button>
              </div>
              <div className="course-grid-home">
                {(enrolledCourses || [])
                  .filter((c) => c && c.id)
                  .slice(0, 4)
                  .map((course) => (
                    <div
                      className="course-card-home"
                      key={course.id}
                      onClick={() => navigate(`/player/${course.id}`)}
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
                      <div className="course-body-home">
                        <h4 className="course-title-home">{course.title}</h4>
                        <div className="course-progress-mini">
                          <div
                            className="p-bar"
                            style={{ width: `${course.progress_pct}%` }}
                          ></div>
                        </div>
                        <div className="course-footer-badges">
                          <span className="course-cat-badge">
                            {course.category}
                          </span>
                          <span className="course-level-badge">
                            {course.level || "Beginner"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ════════════ ALL TRAININGS GRID ════════════ */}
          <div
            id="all-tracks-grid"
            className="section-header-home"
            style={{ marginTop: "3rem" }}
          >
            <div>
              <h2>Explore All Training Tracks</h2>
              <p className="section-sub">
                Browse every training module across all departments.
              </p>
            </div>
            <button
              className="view-all-btn"
              onClick={() => navigate("/courses")}
            >
              View All Trainings →
            </button>
          </div>

          {categories.length > 0 && (
            <div className="category-tabs">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`tab-btn ${activeTab === cat ? "active" : ""}`}
                  onClick={() => {
                    setActiveTab(cat);
                    setActiveLevel("All");
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          <div
            className="level-tabs"
            style={{ display: "flex", gap: "0.8rem", padding: "0.5rem 0 2rem" }}
          >
            {levelOptions.map((lvl) => (
              <button
                key={lvl}
                className={`level-tab-btn ${activeLevel === lvl ? "active" : ""}`}
                onClick={() => setActiveLevel(lvl)}
                style={{
                  padding: "0.4rem 1.2rem",
                  borderRadius: "100px",
                  border: "1px solid #e2e8f0",
                  background:
                    activeLevel === lvl ? "var(--primary-blue)" : "white",
                  color: activeLevel === lvl ? "white" : "var(--text-sub)",
                  fontWeight: "600",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {lvl}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="courses-loading">
              <div className="courses-spinner"></div>
              <p>Loading trainings...</p>
            </div>
          ) : filteredCourses.length > 0 ? (
            <div className="course-grid-home">
              {filteredCourses.slice(0, 8).map((course) => (
                <div
                  className="course-card-home"
                  key={course.id}
                  onClick={() => navigate(`/player/${course.id}`)}
                >
                  <div className="course-thumb-home">
                    <img
                      src={
                        course.thumbnail ||
                        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400"
                      }
                      alt={course.title}
                      onError={(e) => {
                        e.target.src =
                          "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400";
                      }}
                    />
                    <div
                      className="course-overlay-home"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/player/${course.id}`);
                      }}
                    >
                      <button className="preview-btn-home">
                        Start Learning
                      </button>
                    </div>
                  </div>
                  <div className="course-body-home">
                    <h4 className="course-title-home">{course.title}</h4>
                    <p className="course-instructor-home">
                      {course.tutor_name || "Internal Expert"}
                    </p>
                    <div className="course-meta-home">
                      <span className="chapter-count">
                        {course.chapters?.length || 0} lessons
                      </span>
                    </div>
                    <div className="course-footer-badges">
                      <span className="course-cat-badge">
                        {course.category}
                      </span>
                      <span className="course-level-badge">
                        {course.level || "Beginner"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-courses-home">
              <h3>No results found</h3>
              <p>Try adjusting your search or filters.</p>
            </div>
          )}
        </div>
      </section>

      {/* --- CTA --- */}
      <section className="cta-section">
        <div className="cta-container">
          <h2>Ready to Enhance Your Skills?</h2>
          <p>
            Start your company training track today and master the tools of the
            trade.
          </p>
          <div className="cta-buttons">
            <button
              className="cta-btn-primary"
              onClick={() =>
                navigate(props.isLoggedIn ? "/courses" : "/signup")
              }
            >
              Get Started
            </button>
            <button
              className="cta-btn-secondary"
              onClick={() => navigate("/courses")}
            >
              Browse Tracks
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;

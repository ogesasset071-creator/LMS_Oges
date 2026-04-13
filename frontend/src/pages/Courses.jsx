import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Courses.css";
import api from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { FiBook, FiSearch, FiCode, FiGrid, FiLayout, FiMaximize, FiClock, FiFilter, FiMonitor, FiCpu, FiFeather, FiBookOpen, FiShield, FiSmartphone, FiDatabase, FiSettings, FiLayers } from "react-icons/fi";

const Courses = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const s = q.get("search");
    if (s) setSearchTerm(s);
    const cParam = q.get("category");
    if (cParam) setActiveCategory(cParam);

    const fetchCourses = async (p = 1, append = false) => {
      try {
        if (append) setLoadingMore(true);
        else setLoading(true);

        const res = await api.get(`/courses?page=${p}&limit=12&category=${activeCategory}`);

        if (append) {
          setCourses(prev => [...prev, ...res.data.courses]);
        } else {
          setCourses(res.data.courses);
        }

        setTotalPages(res.data.pages);
        setPage(res.data.page);
      } catch (err) {
        console.error("Error fetching courses:", err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    };
    fetchCourses(1, false);
  }, [location.search, activeCategory]);

  const loadMore = () => {
    if (page < totalPages) {
      const fetchCoursesAppend = async (p) => {
        try {
          setLoadingMore(true);
          const res = await api.get(`/courses?page=${p}&limit=12&category=${activeCategory}`);
          setCourses(prev => [...prev, ...res.data.courses]);
          setTotalPages(res.data.pages);
          setPage(res.data.page);
        } finally {
          setLoadingMore(false);
        }
      };
      fetchCoursesAppend(page + 1);
    }
  };

  const dynamicCategories = React.useMemo(() => {
    const items = [
      { name: "Programming", icon: <FiCode /> },
      { name: "Data Science", icon: <FiDatabase /> },
      { name: "Design", icon: <FiFeather /> },
    ];
    return [{ name: "All", icon: <FiGrid /> }, ...items];
  }, []);

  const filteredCourses = courses.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Level tag based on chapter count
  const getLevelTag = (chapCount) => {
    if (chapCount <= 4) return { label: "Beginner", color: "#22c55e" };
    if (chapCount <= 6) return { label: "Intermediate", color: "#f59e0b" };
    return { label: "Advanced", color: "#a855f7" };
  };

  return (
    <div className="courses-page-premium">

      <header className="courses-hero-modern">
        <div className="container">
          <div className="hero-content-courses">
            <span className="badge-premium">Platform Training Library</span>
            <h1>Structured <span className="text-gradient">Training Tracks</span></h1>
            <p>Master skills through leveled trainings — Beginner to Advanced, curated by internal experts.</p>
            <div className="courses-search-wrapper">
              <FiSearch className="search-icon-inner" />
              <input
                type="text"
                placeholder="Search trainings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className="search-btn-premium">Find</button>
            </div>
          </div>
        </div>
      </header>

      <section className="courses-browser-modern container">
        <aside className="filters-aside-glass">
          <div className="filter-header">
            <FiFilter /> <h3>Categories</h3>
          </div>
          <div className="filter-list-premium">
            {dynamicCategories.map((cat) => (
              <button
                key={cat.name}
                className={`filter-item-modern ${activeCategory === cat.name ? "active" : ""}`}
                onClick={() => setActiveCategory(cat.name)}
              >
                <span className="cat-icon">{cat.icon}</span>
                <span className="cat-label">{cat.name}</span>
              </button>
            ))}
          </div>
        </aside>

        <main className="courses-content-area">
          <div className="results-header-modern">
            <div className="results-info">
              <h3>{activeCategory === "All" ? "All Trainings" : activeCategory} Modules</h3>
              <p>Showing {filteredCourses.length} internal training tracks</p>
            </div>
          </div>

          {loading ? (
            <div className="loading-grid-skeleton">
              <div className="pulse-loader"></div>
              <p>Loading modules...</p>
            </div>
          ) : (
            <div className="premium-courses-grid">
              {filteredCourses.length > 0 ? (
                <>
                  {filteredCourses.map((course) => {
                    const chapCount = course.chapters_count || course.chapters?.length || 0;
                    const level = getLevelTag(chapCount);
                    return (
                      <div className="p-course-card" key={course.id} onClick={() => navigate(`/player/${course.id}`)}>
                        <div className="p-card-thumb">
                          <img src={course.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400"} alt={course.title} />
                          <div className="level-tag-overlay" style={{ background: level.color }}>
                            {level.label}
                          </div>
                        </div>
                        <div className="p-card-body">
                          <div className="p-category-tag">{course.category}</div>
                          <h4>{course.title}</h4>
                          <p className="p-admin">By {course.admin_name || "Internal Expert"}</p>

                          <div className="p-footer-perks">
                            <span><FiBookOpen /> {chapCount} Chapters</span>
                            <span><FiLayers /> 3 Levels</span>
                          </div>
                          <button className="p-enroll-button" onClick={(e) => { e.stopPropagation(); navigate(`/player/${course.id}`); }}>Start Learning</button>
                        </div>
                      </div>
                    );
                  })}

                  {page < totalPages && (
                    <div className="pagination-footer">
                      <button
                        className="load-more-btn-premium"
                        onClick={loadMore}
                        disabled={loadingMore}
                      >
                        {loadingMore ? "Loading..." : "Show More Trainings"}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="empty-results-state">
                  <div className="empty-icon"><FiMaximize size={48} /></div>
                  <h3>No matches found</h3>
                  <p>Try adjusting your filters or search keywords.</p>
                  <button className="reset-filter-btn" onClick={() => { setSearchTerm(""); setActiveCategory("All"); }}>Reset All Filters</button>
                </div>
              )}
            </div>
          )}
        </main>
      </section>

      <Footer />
    </div>
  );
};

export default Courses;

import React, { useState, useEffect, useMemo } from "react";
import "./admins.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiBriefcase, FiUsers, FiStar, FiFilter } from "react-icons/fi";

const Admins = () => {
  const navigate = useNavigate();
  const [admins, setadmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = ["All", "Internal Lead", "Training Coordinator", "Engineering", "HR"];

  useEffect(() => {
    const fetchadmins = async () => {
      try {
        const res = await api.get("/admins");
        const enhanced = res.data.map(t => ({
          ...t,
          role: t.Lms_role === "admin" ? "Internal Lead" : "Training Coordinator",
          displayRole: t.Lms_role === "admin" ? "Internal Lead" : "Training Coordinator",
          learners: "Team Member",
          photo: t.Lms_avatar || ""
        }));
        setadmins(enhanced);
      } catch (err) {
        console.error("Error fetching admins:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchadmins();
  }, []);

  const filteredadmins = useMemo(() => {
    return admins.filter(t => {
      const matchesSearch =
        t.Lms_full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.Lms_role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.Lms_bio?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        activeCategory === "All" ||
        t.Lms_role === activeCategory ||
        (activeCategory === "Engineering" && t.Lms_bio?.toLowerCase().includes("engineering")) ||
        (activeCategory === "HR" && t.Lms_bio?.toLowerCase().includes("hr"));

      return matchesSearch && matchesCategory;
    });
  }, [admins, searchQuery, activeCategory]);

  return (
    <div className="admins-page">

      <header className="admins-hero">
        <div className="inner-hero-admins">
          <h1>Meet the Leads</h1>
          <p>
            Connect with internal experts dedicated to our team's growth,
            knowledge sharing, and continuous professional development.
          </p>

          <div className="search-filter-area">
            <div className="search-input-wrapper">
              <FiSearch className="search-icon-hero" />
              <input
                type="text"
                className="search-input-hero"
                placeholder="Search experts by name, role or expertise..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="category-pills">
              {categories.map(cat => (
                <button
                  key={cat}
                  className={`pill ${activeCategory === cat ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="admins-container">
        {loading ? (
          <div className="dash-loading">
            <div className="dash-spinner"></div>
            <p>Gathering our expert leads...</p>
          </div>
        ) : filteredadmins.length > 0 ? (
          <div className="admins-grid-full">
            {filteredadmins.map((admin, idx) => (
              <div
                className="admin-card-premium"
                key={admin.id || admin.name}
                style={{ animationDelay: `${idx * 0.1}s`, animation: 'fadeInUp 0.6s both' }}
              >
                <div className="admin-avatar-wrapper">
                  <div className="admin-avatar-lg">
                    {admin.Lms_avatar ? (
                      <img src={admin.Lms_avatar} alt={admin.Lms_full_name} />
                    ) : (
                      <div className="avatar-placeholder-mini">{admin.Lms_full_name?.charAt(0)}</div>
                    )}
                  </div>
                </div>
                <div className="admin-main-info">
                  <h3>{admin.Lms_full_name || admin.name}</h3>
                  <div className="admin-role-home">{admin.displayRole}</div>
                  <div className="admin-bio-short">{admin.Lms_bio || "Internal expert sharing knowledge and leading critical training initiatives for the company."}</div>

                  <div className="admin-stats-professional">
                    <div className="t-stat">
                      <FiStar className="t-icon" style={{ color: '#eab308' }} />
                      <div>
                        <span className="t-label">Lead</span>
                      </div>
                    </div>
                    <div className="t-stat">
                      <FiUsers className="t-icon" style={{ color: '#f59e0b' }} />
                      <div>
                        <span className="t-label">Team</span>
                      </div>
                    </div>
                  </div>

                  <button
                    className="view-admin-btn-premium"
                    onClick={() => navigate(`/admin/${admin.id}`)}
                  >
                    View Profile
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🔍</div>
            <h2>No Experts Found</h2>
            <p>Try adjusting your search or filters to find what you're looking for.</p>
            <button
              className="pill active"
              style={{ marginTop: '1.5rem', padding: '0.8rem 2rem' }}
              onClick={() => { setSearchQuery(""); setActiveCategory("All"); }}
            >
              Reset Search
            </button>
          </div>
        )}
      </main>

      <Footer />

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Admins;

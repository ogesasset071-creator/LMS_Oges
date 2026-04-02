import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiArrowRight, FiGrid, FiLayers } from "react-icons/fi";
import "./Categories.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import api from "../services/api";

const Categories = (props) => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalCourses: 0, totalCats: 0 });

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await api.get("/courses");
        const courseList = res.data.courses || [];
        
        // Group by category
        const catMap = {};
        courseList.forEach(c => {
          const catName = c.category || "General Training";
          if (!catMap[catName]) {
            catMap[catName] = { name: catName, count: 0, icon: "📚" };
          }
          catMap[catName].count++;
        });

        // Smart icon mapping for common categories
        const iconLibrary = {
          "Web Development": "🌐",
          "Data Science": "📈",
          "UI/UX Design": "🎨",
          "Digital Marketing": "📣",
          "Machine Learning": "🧠",
          "Cloud Computing": "☁️",
          "Cyber Security": "🛡️",
          "Game Development": "🎮",
          "Mobile Development": "📱",
          "DevOps": "♾️",
          "Artificial Intelligence": "🤖",
          "Business": "💼",
          "Language Learning": "🗣️",
          "Photography": "📷"
        };

        const finalCats = Object.values(catMap).map(c => ({
          ...c,
          icon: iconLibrary[c.name] || c.icon,
          countText: `${c.count} ${c.count === 1 ? 'Module' : 'Modules'}`
        }));

        setCategories(finalCats);
        setStats({
          totalCourses: courseList.length,
          totalCats: finalCats.length
        });
      } catch (err) {
        console.error("Failed to load categories:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCats();
  }, []);

  const filteredCats = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="categories-page">
      <Navbar {...props} />

      <header className="cat-hero">
        <div className="inner-hero">
          <h1>Master Your Path</h1>
          <p>
            Dive into specialized streams and accelerate your professional 
            growth through curated module collections.
          </p>
        </div>
      </header>

      <section className="cat-controls">
        <div className="cat-search-box">
          <FiSearch />
          <input 
            type="text" 
            placeholder="Search learning domains..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="cat-stats-summary">
          <div className="stat-pill">
            <span>{stats.totalCats}</span>
            <span>Streams</span>
          </div>
          <div className="stat-pill">
            <span>{stats.totalCourses}</span>
            <span>Modules</span>
          </div>
        </div>
      </section>

      <main className="cat-container">
        {loading ? (
          <div className="courses-loading">
            <div className="courses-spinner"></div>
            <p className="initializing-text">MAPPING KNOWLEDGE GRAPHS...</p>
          </div>
        ) : (
          <>
            <div className="cat-grid-full">
              {filteredCats.map((cat) => (
                <div 
                  className="cat-card-premium" 
                  key={cat.name}
                  onClick={() => navigate(`/courses?category=${cat.name}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="cat-icon-lg">{cat.icon}</div>
                  <h3>{cat.name}</h3>
                  <p>{cat.countText}</p>
                  <button className="view-cat-btn">
                    Explore Stream <FiArrowRight />
                  </button>
                </div>
              ))}
            </div>

            {filteredCats.length === 0 && (
              <div className="edu-placeholder-view" style={{ textAlign: 'center', padding: '5rem 0' }}>
                <FiLayers size={80} style={{ opacity: 0.1, marginBottom: '2rem' }} />
                <h3>No streams found matching "{searchTerm}"</h3>
                <p>Try using broader keywords or explore all available modules.</p>
                <button 
                  className="btn-primary" 
                  style={{ marginTop: '2rem', padding: '1rem 3rem' }}
                  onClick={() => setSearchTerm("")}
                >
                  Show All Streams
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Categories;

import React from "react";
import { useNavigate } from "react-router-dom";
import "./Categories.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import api from "../services/api";

const Categories = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await api.get("/courses");
        const courseList = res.data.courses || [];
        // Group by category
        const catMap = {};
        courseList.forEach(c => {
          if (!catMap[c.category]) {
            catMap[c.category] = { name: c.category, count: 0, icon: "📚" };
          }
          catMap[c.category].count++;
        });

        // Add some icons based on names for flair
        const icons = {
          "Web Development": "🌐",
          "Data Science": "📊",
          "UI/UX Design": "🎨",
          "Mobile Apps": "📱",
          "Cyber Security": "🛡️",
          "Artificial Intelligence": "🤖",
          "Cloud Computing": "☁️",
          "DevOps": "⚙️",
          "Blockchain": "⛓️",
          "Full Stack Development": "🚀"
        };

        const finalCats = Object.values(catMap).map(c => ({
          ...c,
          icon: icons[c.name] || c.icon,
          countText: `${c.count} ${c.count === 1 ? 'Module' : 'Modules'}`
        }));
        setCategories(finalCats);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCats();
  }, []);

  return (
    <div className="categories-page">

      <header className="cat-hero">
        <div className="inner-hero">
          <h1>Explore by Category</h1>
          <p>Find your niche and start learning from thousands of free resources.</p>
        </div>
      </header>

      <main className="cat-container">
        {loading ? (
          <div className="courses-loading">
            <div className="courses-spinner"></div>
            <p>Gathering categories...</p>
          </div>
        ) : (
          <div className="cat-grid-full">
            {categories.map((cat) => (
              <div className="cat-card-premium" key={cat.name}>
                <div className="cat-icon-lg">{cat.icon}</div>
                <h3>{cat.name}</h3>
                <p>{cat.countText}</p>
                <button
                  className="view-cat-btn"
                  onClick={() => navigate(`/courses?category=${cat.name}`)}
                >
                  Browse Collection
                </button>
              </div>
            ))}
            {categories.length === 0 && (
              <div className="edu-placeholder-view">
                <h3>No categories discovered yet.</h3>
                <p>Add some courses to see our training library expand!</p>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Categories;

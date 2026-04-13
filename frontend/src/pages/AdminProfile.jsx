import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./adminProfile.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import api from "../services/api";
import { FiBookOpen, FiPlayCircle, FiAward, FiArrowLeft, FiMail, FiZap, FiStar } from "react-icons/fi";

const adminProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [admin, setadmin] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [adminRes, coursesRes] = await Promise.all([
          api.get(`/admins/${id}`),
          api.get(`/admins/${id}/courses`)
        ]);
        setadmin(adminRes.data);
        setCourses(coursesRes.data);
      } catch (err) {
        console.error("Error fetching admin profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="profile-loading-screen">
        <div className="dash-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="profile-error-screen">
        <h2>Lead Not Found</h2>
        <button onClick={() => navigate("/admins")}>Back to Leads</button>
      </div>
    );
  }

  return (
    <div className="admin-profile-page">
      <div className="profile-hero-section">
        <div className="profile-hero-content container">
          <button className="back-btn-profile" onClick={() => navigate(-1)}>
            <FiArrowLeft /> Back
          </button>

          <div className="profile-main-header">
            <div className="profile-avatar-giant">
              {admin.Lms_avatar ? (
                <img src={admin.Lms_avatar} alt={admin.Lms_full_name} />
              ) : (
                <div className="avatar-placeholder-giant">
                  {admin.Lms_full_name?.charAt(0)}
                </div>
              )}
              <div className="online-indicator-giant"></div>
            </div>

            <div className="profile-titles">
              <span className="premium-badge-profile">Training Lead</span>
              <h1>{admin.Lms_full_name}</h1>
              <p className="profile-tagline text-gradient-orange">
                {admin.Lms_role === 'admin' ? 'Internal Lead' : 'Training Coordinator'} • {admin.Lms_category || 'General'}
              </p>

              <div className="profile-quick-stats">
                <div className="q-stat-item">
                  <FiBookOpen /> <span>{courses.length} Modules Published</span>
                </div>
                <div className="q-stat-item">
                  <FiZap /> <span>Expert in {admin.Lms_category || 'Various Fields'}</span>
                </div>
                <div className="q-stat-item">
                  <FiMail /> <span>{admin.Lms_email}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="profile-body-container container">
        <div className="profile-grid-layout">
          <div className="profile-left-col">
            <section className="profile-bio-card premium-card">
              <h3>Biography</h3>
              <p>{admin.Lms_bio || "This internal expert is dedicated to sharing knowledge and fostering team growth through structured training modules."}</p>

              <div className="profile-expertise-tags">
                <span className="exp-tag">Leadership</span>
                <span className="exp-tag">Training</span>
                <span className="exp-tag">{admin.Lms_category || 'Consulting'}</span>
              </div>
            </section>


          </div>

          <div className="profile-right-col">
            <div className="section-title-flex">
              <h3>Published Training Tracks ({courses.length})</h3>
            </div>

            <div className="admin-courses-list">
              {courses.length > 0 ? (
                courses.map(course => (
                  <div className="profile-course-card-horizontal" key={course.id} onClick={() => navigate(`/player/${course.id}`)}>
                    <div className="pc-thumb">
                      <img src={course.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300"} alt={course.title} />
                    </div>
                    <div className="pc-content">
                      <div className="pc-cat">{course.category}</div>
                      <h4>{course.title}</h4>
                      <div className="pc-meta">
                        <span><FiBookOpen size={14} /> {course.chapters?.length || 0} Lessons</span>
                        <span className="pc-level-tag">{course.level || 'Beginner'}</span>
                      </div>
                      <button className="pc-start-btn"><FiPlayCircle /> Start Course</button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-courses-profile">
                  <p>This lead hasn't published any public modules yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default adminProfile;

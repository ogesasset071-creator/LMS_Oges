import React, { useState, useEffect, useCallback } from "react";
import "./Profile.css";
import Navbar from "../components/Navbar";
import api from "../services/api";
import logo from "../assets/OgesLogo.png";
import Cropper from 'react-easy-crop';
import { getCroppedImgFile } from "../utils/canvasUtils";

const Profile = (props) => {
  const {
    user: initialUser,
    onUserUpdate,
    onHomeClick
  } = props;
  const [user, setUser] = useState(initialUser);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Ongoing");

  const [editName, setEditName] = useState(user?.Lms_full_name || "");
  const [editBio, setEditBio] = useState(user?.Lms_bio || "");
  const [editAvatar, setEditAvatar] = useState(user?.Lms_avatar || "");
  const [editCategory, setEditCategory] = useState(user?.Lms_category || "");
  const [loading, setLoading] = useState(false);
  const [myCourses, setMyCourses] = useState([]);
  const [eduStats, setEduStats] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [certData, setCertData] = useState(null);
  const [showCert, setShowCert] = useState(false);

  // Cropper State
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [coursesRes, meRes, assignRes] = await Promise.all([
        api.get("/user/courses"),
        api.get("/user/me"),
        api.get("/assignments")
      ]);
      setMyCourses(coursesRes.data);
      setUser(meRes.data);
      setAssignments(assignRes.data);
      if (onUserUpdate) onUserUpdate(meRes.data);

      if (meRes.data.Lms_role === "admin") {
        const statsRes = await api.get("/Admin/stats");
        setEduStats(statsRes.data);
      }
    } catch (e) {
      console.error("Error fetching data", e);
    }
  }, [onUserUpdate]);

  useEffect(() => {
    if (initialUser) fetchData();
  }, [initialUser, fetchData]);

  useEffect(() => {
    setUser(initialUser);
    setEditName(initialUser?.Lms_full_name || "");
    setEditBio(initialUser?.Lms_bio || "");
    setEditAvatar(initialUser?.Lms_avatar || "");
    setEditCategory(initialUser?.Lms_category || "");
  }, [initialUser]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put("/user/profile", {
        Lms_full_name: editName,
        Lms_bio: editBio,
        Lms_avatar: editAvatar,
        Lms_category: editCategory,
      });
      setUser(res.data);
      if (onUserUpdate) onUserUpdate(res.data);
      setIsEditModalOpen(false);
    } catch (err) {
      console.error("Error updating profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteAssignment = async (id) => {
    try {
      const res = await api.post(`/assignments/${id}/complete`);
      if (res.data.status === "success" || res.data.status === "already_done") {
        fetchData();
      }
    } catch (e) { console.error(e); }
  };

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result);
        setShowCropper(true);
      });
      reader.readAsDataURL(file);
    }
  };

  const handleUploadAvatar = async () => {
    setUploadingAvatar(true);
    try {
      const croppedImageBlob = await getCroppedImgFile(imageSrc, croppedAreaPixels);
      const formData = new FormData();
      formData.append("file", croppedImageBlob, "avatar.jpg");

      const res = await api.post("/user/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setEditAvatar(res.data.Lms_avatar);
      setUser(prev => ({ ...prev, avatar: res.data.Lms_avatar }));
      if (onUserUpdate) onUserUpdate({ ...user, avatar: res.data.Lms_avatar });
      setShowCropper(false);
      setImageSrc(null);
    } catch (e) {
      console.error("Error uploading avatar:", e);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const getAchievements = () => {
    const xp = user?.Lms_xp || 0;
    const tiers = [
      { threshold: 100, name: "Learner 🥉", icon: "🥉" },
      { threshold: 500, name: "Scholar 🥈", icon: "🥈" },
      { threshold: 1000, name: "Expert 🥇", icon: "🥇" },
      { threshold: 2500, name: "Master 💎", icon: "💎" },
      { threshold: 5000, name: "Legend 💠", icon: "💠" },
      { threshold: 10000, name: "Immortal ♾️", icon: "♾️" },
    ];
    return tiers.map(t => ({
      ...t,
      unlocked: xp >= t.threshold
    }));
  };

  return (
    <div className="profile-page">


      <main className="profile-content">
        <section className="profile-header-card">
          <div className="profile-info-main">
            <div className="avatar-wrapper-premium">
              <div className="main-avatar-premium">
                {user?.Lms_avatar ? (
                  <img src={user.Lms_avatar} alt="Profile" />
                ) : (
                  <div className="placeholder-avatar">🎓</div>
                )}
              </div>
              <input
                type="file"
                id="avatar-upload-input"
                hidden
                accept="image/*"
                onChange={handleFileChange}
              />
              <button
                className="edit-avatar-btn-premium"
                onClick={() => document.getElementById('avatar-upload-input').click()}
              >
                ✏️
              </button>
            </div>
            <div className="user-details-premium">
              <div className="name-row-p">
                <h1>{user?.Lms_full_name || "Scholar"}</h1>
                <span className={`role-badge-p ${user?.Lms_role}`}>{user?.Lms_role}</span>
              </div>
              <p className="username-premium">@{user?.Lms_email?.split("@")[0] || "learner"} • {user?.Lms_category || "General Learner"}</p>
              <p className="bio-premium">{user?.Lms_bio || "Passionate about learning and skill-building on LMS Oges."}</p>
              <div className="badge-showcase-premium">
                {(user?.Lms_badges || "").split(',').filter(Boolean).map((b, i) => (
                  <span className="badge-item-premium" key={i} title="Earned Achievement">{b}</span>
                ))}
              </div>
            </div>
            <button className="btn-edit-profile-premium" onClick={() => setIsEditModalOpen(true)}>Edit Profile</button>
          </div>

          <div className="profile-stats-row">
            <div className="p-stat-premium">
              <div className="p-stat-icon-wrapper orange">🔥</div>
              <div className="p-stat-info">
                <span className="p-stat-val">{user?.Lms_streak || 1} Days</span>
                <span className="p-stat-label">Streak</span>
              </div>
            </div>
            <div className="p-stat-premium">
              <div className="p-stat-icon-wrapper blue">⏱️</div>
              <div className="p-stat-info">
                <span className="p-stat-val">{user?.Lms_total_minutes || 0}</span>
                <span className="p-stat-label">Min Learned</span>
              </div>
            </div>
            <div className="p-stat-premium">
              <div className="p-stat-icon-wrapper green">🌟</div>
              <div className="p-stat-info">
                <span className="p-stat-val">{user?.Lms_xp || 0}</span>
                <span className="p-stat-label">Total XP</span>
              </div>
            </div>
          </div>
        </section>

        <section className="profile-section-premium level-card-premium">
          <div className="level-flex">
            <div className="level-text">
              <h3>Level {Math.floor((user?.Lms_xp || 0) / 1000) + 1}</h3>
              <p>{1000 - ((user?.Lms_xp || 0) % 1000)} XP to next milestone</p>
            </div>
            <div className="xp-bar-container">
              <div className="xp-bar-track">
                <div
                  className="xp-bar-fill-premium"
                  style={{ width: `${((user?.Lms_xp || 0) % 1000) / 10}%` }}
                ></div>
              </div>
              <span className="xp-percentage">
                {Math.floor(((user?.Lms_xp || 0) % 1000) / 10)}%
              </span>
            </div>
          </div>
        </section>

        <div className="profile-grid-premium">
          <section className="profile-section-premium">
            <div className="section-header-premium">
              <h2 className="section-title-premium">My Learning</h2>
              <div className="tabs-premium">
                {["Ongoing", "Completed"].map((tab) => (
                  <button
                    key={tab}
                    className={`tab-btn-premium ${activeTab === tab ? "active" : ""}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="my-courses-list">
              {myCourses.filter(c => activeTab === 'Ongoing' ? (c.progress_pct < 100) : (c.progress_pct === 100)).length > 0 ? (
                myCourses.filter(c => activeTab === 'Ongoing' ? (c.progress_pct < 100) : (c.progress_pct === 100)).map((course) => (
                  <div
                    className="course-item-compact"
                    key={course.id}
                    onClick={() =>
                      onHomeClick && onHomeClick(`/player/${course.id}`)
                    }
                  >
                    <div className="course-img-mini">
                      <img
                        src={course.thumbnail || "https://img.freepik.com/free-vector/video-player-interface-concept-design_23-2148493190.jpg"}
                        alt={course.title}
                      />
                    </div>
                    <div className="course-info-compact">
                      <h4>{course.title}</h4>
                      <div className="progress-mini-bar">
                        <div
                          className="progress-mini-fill"
                          style={{ width: `${course.progress_pct || 0}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="course-actions-mini">
                      <button className="btn-cert-mini" onClick={(e) => {
                        e.stopPropagation();
                        setCertData(course);
                        setShowCert(true);
                      }}>📜 Certificate</button>
                      {course.progress_pct < 100 && (
                        <button className="btn-resume-mini">▶</button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  No {activeTab.toLowerCase()} courses yet.
                </div>
              )}
            </div>
          </section>

          {user?.Lms_role === "admin" && eduStats && (
            <section className="profile-section-premium Admin-insights-card">
              <div className="section-header-premium">
                <h2 className="section-title-premium">Teaching Insights</h2>
              </div>
              <div className="edu-stats-grid">
                <div className="edu-insight-item">
                  <span className="ei-val">{eduStats.total_learners}</span>
                  <span className="ei-label">Active Learners</span>
                </div>
                <div className="edu-insight-item">
                  <span className="ei-val">{eduStats.total_courses}</span>
                  <span className="ei-label">Courses Published</span>
                </div>
                <div className="edu-insight-item">
                  <span className="ei-val">{eduStats.total_xp_given}</span>
                  <span className="ei-label">Community XP Earned</span>
                </div>
              </div>
            </section>
          )}

          <section className="profile-section-premium achievements-card-premium">
            <div className="section-header-premium">
              <h2 className="section-title-premium">XP Achievements</h2>
            </div>
            <div className="achievements-tier-list">
              {getAchievements().map((ach, i) => (
                <div key={i} className={`ach-tier-item ${ach.unlocked ? 'unlocked' : 'locked'}`}>
                  <div className="ach-icon-circle">{ach.icon}</div>
                  <div className="ach-text">
                    <span className="ach-name">{ach.name}</span>
                    <span className="ach-status">{ach.unlocked ? 'Unlocked' : 'Locked'}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="profile-section-premium tasks-card-premium">
            <div className="section-header-premium">
              <h2 className="section-title-premium">Community Tasks</h2>
            </div>
            <div className="assignments-list-premium">
              {assignments.length > 0 ? (
                assignments.map(a => (
                  <div className={`assignment-card-mini ${a.completed ? 'done' : ''}`} key={a.id}>
                    <div className="a-info">
                      <h4>{a.title}</h4>
                      <p>{a.description}</p>
                    </div>
                    <button className="a-action-btn" disabled={a.completed} onClick={() => handleCompleteAssignment(a.id)}>
                      {a.completed ? 'Done' : 'Complete'}
                    </button>
                  </div>
                ))
              ) : (
                <p className="empty">No tasks available.</p>
              )}
            </div>
          </section>
        </div>
      </main>

      {showCert && certData && (
        <div className="cert-modal-overlay" onClick={() => setShowCert(false)}>
          <div className="cert-card-modern" onClick={e => e.stopPropagation()}>
            <div className="cert-border">
              <div className="cert-content">
                <img src={logo} alt="Company Logo" style={{ height: '70px', marginBottom: '1.5rem', objectFit: 'contain' }} />
                <span className="cert-og-label">OGES PLATFORM</span>
                <h1>CERTIFICATE</h1>
                <p>This is to certify that</p>
                <h2 className="cert-recipient">{user?.Lms_full_name || "Scholar"}</h2>
                <p>has completed</p>
                <h3 className="cert-course-title">{certData.title}</h3>
              </div>
            </div>
            <div className="cert-restriction-notice">
              🛡️ Official Platform Specimen. Sharing and downloading are restricted to maintain authenticity.
            </div>
            <div className="cert-actions-row">
              <button className="cert-btn-close" onClick={() => setShowCert(false)}>Close View</button>
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="modal-overlay-premium" onClick={() => setIsEditModalOpen(false)}>
          <div className="edit-modal-premium" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-premium">
              <h2>Edit Profile</h2>
              <button className="modal-close-btn" onClick={() => setIsEditModalOpen(false)}>✕</button>
            </div>
            <form className="modal-form-premium" onSubmit={handleUpdateProfile}>
              <div className="form-group-premium"><label>Full Name</label><input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} required /></div>
              <div className="form-group-premium"><label>Learning Category</label><input type="text" value={editCategory} onChange={(e) => setEditCategory(e.target.value)} placeholder="e.g. Web Development" /></div>
              <div className="form-group-premium"><label>Bio</label><textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} rows="3"></textarea></div>
              <button type="submit" className="btn-save-premium" disabled={loading}>{loading ? "Saving..." : "Update Profile"}</button>
            </form>
          </div>
        </div>
      )}

      {showCropper && (
        <div className="cropper-modal-overlay">
          <div className="cropper-card">
            <h3>Adjust Profile Image</h3>
            <div className="cropper-container">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            <div className="cropper-controls">
              <div className="zoom-slider-container">
                <label>Zoom</label>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(e.target.value)}
                  className="zoom-slider"
                />
              </div>
              <div className="cropper-buttons">
                <button className="btn-cancel-crop" onClick={() => setShowCropper(false)}>Cancel</button>
                <button className="btn-save-crop" onClick={handleUploadAvatar} disabled={uploadingAvatar}>
                  {uploadingAvatar ? "Uploading..." : "Save Image"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";
import { FiAward, FiCheckCircle, FiPlay, FiBook, FiChevronRight, FiLock } from "react-icons/fi";
import "./Player.css";

const getEmbedUrl = (url) => {
  if (!url) return "";
  let videoId = "";
  if (url.includes("v=")) {
    videoId = url.split("v=")[1].split("&")[0];
  } else if (url.includes("youtu.be/")) {
    videoId = url.split("youtu.be/")[1].split("?")[0];
  } else if (url.includes("embed/")) {
    const base = url.includes("?") ? `${url}&enablejsapi=1` : `${url}?enablejsapi=1`;
    return `${base}&origin=${window.location.origin}`;
  }
  const ytUrl = videoId ? `https://www.youtube.com/embed/${videoId}?enablejsapi=1` : url;
  return ytUrl.includes("?") ? `${ytUrl}&origin=${window.location.origin}` : `${ytUrl}?origin=${window.location.origin}`;
};

const Player = (props) => {
  const { onUserUpdate, setIsGlobalVideoPlaying, user } = props;
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeChapter, setActiveChapter] = useState(null);
  const [notes, setNotes] = useState("");
  const [activeTab, setActiveTab] = useState("content"); // content, notes, resources
  const [savingNote, setSavingNote] = useState(false);
  const [localPP, setLocalPP] = useState(props.user?.pp || 0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Personal Resources
  const [personalResources, setPersonalResources] = useState([]);
  const [personalFile, setPersonalFile] = useState(null);
  const [personalFileTitle, setPersonalFileTitle] = useState("");
  const [uploadingPersonal, setUploadingPersonal] = useState(false);

  const fetchPersonalResources = useCallback(async () => {
    try {
      const res = await api.get(`/courses/${courseId}/personal-resources`);
      setPersonalResources(res.data);
    } catch (e) {
      console.error("Error fetching personal resources", e);
    }
  }, [courseId]);

  useEffect(() => {
    if (activeTab === 'resources') {
      fetchPersonalResources();
    }
  }, [activeTab, fetchPersonalResources]);

  const handleUploadPersonal = async () => {
    if (!personalFile || !personalFileTitle) {
      alert("Please provide a title and select a file.");
      return;
    }
    setUploadingPersonal(true);
    const formData = new FormData();
    formData.append("file", personalFile);
    try {
      await api.post(`/courses/${courseId}/personal-resources?title=${encodeURIComponent(personalFileTitle)}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      fetchPersonalResources();
      setPersonalFile(null);
      setPersonalFileTitle("");
      // Clear file input
      const fileInput = document.getElementById("personal-file-input");
      if (fileInput) fileInput.value = "";
    } catch (e) {
      console.error(e);
      alert("Upload failed.");
    } finally {
      setUploadingPersonal(false);
    }
  };

  useEffect(() => {
    if (user?.pp !== undefined) {
      setLocalPP(user.pp);
    }
  }, [user?.pp]);

  // YouTube API Integration
  useEffect(() => {
    // Inject YT API script
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    let player;
    const interval = setInterval(() => {
      if (window.YT && window.YT.Player && document.getElementById('yt-player')) {
        player = new window.YT.Player('yt-player', {
          events: {
            'onStateChange': (event) => {
              if (event.data === window.YT.PlayerState.PLAYING) {
                setIsPlaying(true);
                if (setIsGlobalVideoPlaying) setIsGlobalVideoPlaying(true);
              } else {
                setIsPlaying(false);
                if (setIsGlobalVideoPlaying) setIsGlobalVideoPlaying(false);
              }
            }
          }
        });
        clearInterval(interval);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      if (player && player.destroy) player.destroy();
      if (setIsGlobalVideoPlaying) setIsGlobalVideoPlaying(false);
    };
  }, [activeChapter?.id, setIsGlobalVideoPlaying]);

  useEffect(() => {
    let timer;
    if (isPlaying) {
      timer = setInterval(() => {
        setLocalPP(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  useEffect(() => {
    let watchTimer;

    const recordImplicitStart = async () => {
      if (activeChapter) {
        try {
          const res = await api.post(`/user/progress?lesson_id=${activeChapter.id}&completed=false`);
          if (onUserUpdate) onUserUpdate(res.data);
        } catch { /* quiet fail */ }
      }
    };

    if (activeChapter) {
      // Trigger start record after 10s of watching
      watchTimer = setTimeout(recordImplicitStart, 10000);
    }

    // Pulse every 60s for heartbeats
    let interval;
    if (activeChapter) {
      interval = setInterval(async () => {
        try {
          await api.post(
            `/user/progress?lesson_id=${activeChapter.id}&completed=false`,
          );
          // Only update global state occasionally or keep it local for performance
          // onUserUpdate(res.data); // Removed this heavy call from every heartbeat
        } catch {
          console.warn("Heartbeat failed");
        }
      }, 60000);
    }

    return () => {
      clearTimeout(watchTimer);
      clearInterval(interval);
    };
  }, [activeChapter, onUserUpdate]);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const [cRes, nRes] = await Promise.all([
          api.get(`/courses/${courseId}`),
          api.get(`/courses/${courseId}/notes`).catch(() => ({ data: { content: "" } }))
        ]);
        setCourse(cRes.data);
        setNotes(nRes.data?.content || "");
        if (cRes.data.chapters && cRes.data.chapters.length > 0) {
          setActiveChapter(cRes.data.chapters[0]);
        } else if (cRes.data.units && cRes.data.units.length > 0 && cRes.data.units[0].chapters?.length > 0) {
          setActiveChapter(cRes.data.units[0].chapters[0]);
        }
      } catch (err) {
        console.error("Error fetching course:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [courseId]);

  const handleClaimCertificate = async () => {
    if (!window.confirm("Ready to claim your certificate? This will mark all lessons as completed!")) return;
    try {
      const res = await api.post(`/user/courses/${courseId}/complete_all`);
      if (onUserUpdate) onUserUpdate(res.data);
      alert("Congratulations! Your certificate is now available in your dashboard.");
      navigate("/dashboard");
    } catch (e) {
      console.error(e);
      alert("Failed to claim certificate. Please try again.");
    }
  };

  const saveNotes = async () => {
    setSavingNote(true);
    try {
      await api.post(`/courses/${courseId}/notes`, { content: notes });
    } catch (e) { console.error(e); }
    setTimeout(() => setSavingNote(false), 1000);
  };

  const handleAddToMyModules = async () => {
    try {
      if (activeChapter) {
        const res = await api.post(`/user/progress?lesson_id=${activeChapter.id}&completed=false`);
        if (onUserUpdate) onUserUpdate(res.data);
        alert("Training pinned to your 'My Training' dashboard!");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to add training.");
    }
  };



  if (loading) {
    return (
      <div className="player-page">
        <div
          className="container"
          style={{ textAlign: "center", padding: "4rem" }}
        >
          <h2>Loading Training...</h2>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="player-page">
        <div
          className="container"
          style={{ textAlign: "center", padding: "4rem" }}
        >
          <h2>Training Not Found</h2>
          <button
            className="btn-save"
            onClick={() => navigate("/courses")}
            style={{ marginTop: "1rem" }}
          >
            Back to Trainings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="player-page">

      <div className="player-container">
        {/* LEFT: VIDEO PLAYER */}
        <div className="player-main-col">
          <div className="video-section">
            <div className="video-wrapper">
              {activeChapter ? (
                <iframe
                  key={activeChapter.id}
                  id="yt-player"
                  src={getEmbedUrl(activeChapter.video_url)}
                  title={activeChapter.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : (
                <div
                  style={{
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    position: "absolute",
                    width: "100%",
                  }}
                >
                  No video available
                </div>
              )}
            </div>
            <div className="video-info">
              <h1>{activeChapter ? activeChapter.title : course.title}</h1>
              <div
                className="video-info-header"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "1.5rem",
                  marginTop: "1.5rem",
                  flexWrap: "nowrap",
                  background: 'var(--card-bg)',
                  padding: '1.25rem',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <span style={{ fontWeight: 800, color: "var(--primary-blue)", fontSize: '1.25rem', letterSpacing: '-0.02em' }}>
                      {course.tutor_name || "LMS Oges Expert"}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: "var(--text-sub)", fontSize: '0.9rem', fontWeight: 600 }}>
                      <span>{course.category}</span>
                      <span>•</span>
                      <span>{course.chapters?.length || 0} Lectures</span>
                    </div>
                  </div>

                  <div className="pp-badge-modern" style={{
                    background: 'rgba(234, 179, 8, 0.1)',
                    color: '#eab308',
                    border: '1px solid rgba(234, 179, 8, 0.3)',
                    padding: '8px 16px',
                    borderRadius: '100px',
                    fontWeight: '900',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    boxShadow: '0 4px 12px rgba(234, 179, 8, 0.1)'
                  }}>
                    <span style={{ fontSize: '1.4rem' }}>✨</span> <span>{localPP} / {course.required_pp || 200} PP</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <button
                    className="add-to-modules-btn"
                    onClick={handleAddToMyModules}
                    style={{
                      background: 'rgba(251, 146, 60, 0.05)',
                      color: 'var(--primary-blue)',
                      border: '1px solid var(--primary-blue)',
                      padding: '0.5rem 1.25rem',
                      borderRadius: '8px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <FiBook /> Add to My Training
                  </button>
                  <button
                    className="claim-cert-btn-premium"
                    onClick={() => localPP >= (course.required_pp || 200) && handleClaimCertificate()}
                    style={{
                      background: localPP >= (course.required_pp || 200) ? 'var(--gradient-blue)' : '#cbd5e1',
                      color: 'white',
                      border: 'none',
                      padding: '0.5rem 1.25rem',
                      borderRadius: '8px',
                      fontWeight: '800',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: localPP >= (course.required_pp || 200) ? 'pointer' : 'not-allowed',
                      fontSize: '0.85rem',
                      whiteSpace: 'nowrap'
                    }}
                    disabled={localPP < (course.required_pp || 200)}
                  >
                    {localPP >= (course.required_pp || 200) ? <FiAward /> : <FiLock />} {localPP >= (course.required_pp || 200) ? "Add to Certificate" : `Locked (Need ${course.required_pp || 200} PP)`}
                  </button>
                </div>
              </div>
              <p style={{ marginTop: "1rem", lineHeight: 1.7 }}>
                {activeChapter?.description || course.description}
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT: CONTENT & NOTES TABS */}
        <aside className="chapters-sidebar">
          <div className="sidebar-tabs">
            <button className={activeTab === 'content' ? 'active' : ''} onClick={() => setActiveTab('content')}>Content</button>
            <button className={activeTab === 'notes' ? 'active' : ''} onClick={() => setActiveTab('notes')}>Notes</button>
            <button className={activeTab === 'resources' ? 'active' : ''} onClick={() => setActiveTab('resources')}>Resources</button>
          </div>

          {activeTab === 'content' ? (
            <>
              <h3>Training Content</h3>
              {course.units && course.units.length > 0 ? (
                course.units.map((unit) => (
                  <div key={unit.id} className="unit-item">
                    <div className="unit-header">
                      <h4>{unit.title}</h4>
                      <span className="unit-badge">
                        {unit.chapters?.length || 0} Lessons
                      </span>
                    </div>
                    <div className="unit-chapters">
                      {(unit.chapters || []).map((chap) => (
                        <div
                          key={chap.id}
                          className={`chapter-item ${activeChapter?.id === chap.id ? "active" : ""}`}
                          onClick={() => setActiveChapter(chap)}
                        >
                          <div className="chapter-num">{chap.order_num}</div>
                          <span className="chapter-title">{chap.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : course.chapters && course.chapters.length > 0 ? (
                course.chapters.map((chap) => (
                  <div
                    key={chap.id}
                    className={`chapter-item ${activeChapter?.id === chap.id ? "active" : ""}`}
                    onClick={() => setActiveChapter(chap)}
                  >
                    <div className="chapter-num">{chap.order_num}</div>
                    <span className="chapter-title">{chap.title}</span>
                  </div>
                ))
              ) : (
                <p style={{ color: "var(--text-sub)" }}>
                  No content uploaded for this training yet.
                </p>
              )}
            </>
          ) : activeTab === 'notes' ? (
            <div className="notes-area-player">
              <h3>My Private Notes</h3>
              <p className="hint">Notes are saved to your profile for this training.</p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Start typing your study notes here..."
              />
              <button className="save-notes-btn" onClick={saveNotes}>
                {savingNote ? "Saving..." : "Save Notes"}
              </button>
            </div>
          ) : (
            <div className="resources-area-player" style={{ padding: '0.5rem' }}>
              <h3>Study Materials</h3>
              <p className="hint" style={{ marginBottom: '1.5rem', fontSize: '0.85rem', color: 'var(--text-sub)' }}>
                Download PDFs, notes, and other materials provided for this training.
              </p>

              {/* Chapter Specific Resources */}
              {activeChapter && activeChapter.resources && activeChapter.resources.length > 0 && (
                <div className="resource-group" style={{ marginBottom: '2rem' }}>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--primary-blue)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Current Lesson Materials
                  </h4>
                  {activeChapter.resources.map(res => (
                    <a
                      key={res.id}
                      href={res.file_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '1rem',
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        textDecoration: 'none',
                        color: 'var(--text-main)',
                        marginBottom: '0.75rem',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary-blue)'}
                      onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                    >
                      <div style={{ width: '32px', height: '32px', background: 'rgba(59,130,246,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                        {res.file_type === 'pdf' ? '📖' : res.file_type === 'link' ? '🔗' : '📁'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{res.title}</div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.6, textTransform: 'uppercase' }}>{res.file_type} File</div>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--primary-blue)', fontWeight: '700' }}>View / Download</span>
                    </a>
                  ))}
                </div>
              )}

              {/* Course Level Resources */}
              {course.resources && course.resources.length > 0 ? (
                <div className="resource-group">
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--text-sub)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Overall Training Resources
                  </h4>
                  {course.resources.map(res => (
                    <a
                      key={res.id}
                      href={res.file_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '1rem',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        textDecoration: 'none',
                        color: 'var(--text-main)',
                        marginBottom: '0.75rem'
                      }}
                    >
                      <div style={{ width: '32px', height: '32px', background: 'rgba(0,0,0,0.05)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {res.file_type === 'pdf' ? '📚' : '📎'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>{res.title}</div>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--primary-blue)', fontWeight: '700' }}>View / Download</span>
                    </a>
                  ))}
                </div>
              ) : (
                (!activeChapter || !activeChapter.resources || activeChapter.resources.length === 0) && (
                  <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📦</div>
                    <p>No extra resources provided yet.</p>
                  </div>
                )
              )}

              <div className="personal-resources-section" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginTop: '2rem' }}>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--primary-blue)', marginBottom: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  My Private Materials 🛡️
                </h4>
                <div style={{ marginBottom: '1.5rem', background: 'rgba(59,130,246,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(59,130,246,0.1)' }}>
                  <input
                    placeholder="File Name (e.g. My Study Notes)"
                    value={personalFileTitle}
                    onChange={(e) => setPersonalFileTitle(e.target.value)}
                    style={{ width: '100%', marginBottom: '0.8rem', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div className="personal-file-custom">
                      <div className="file-label-modern">
                        {personalFile ? `📎 ${personalFile.name.substring(0, 20)}...` : "Select Study Material"}
                      </div>
                      <input
                        id="personal-file-input"
                        type="file"
                        onChange={(e) => setPersonalFile(e.target.files[0])}
                      />
                    </div>
                    <button
                      onClick={handleUploadPersonal}
                      disabled={uploadingPersonal}
                      style={{
                        width: '100%',
                        padding: '0.8rem',
                        background: 'var(--primary-blue)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontWeight: '800',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        boxShadow: '0 4px 12px rgba(251, 146, 60, 0.3)'
                      }}
                    >
                      {uploadingPersonal ? 'Uploading...' : 'Upload Material'}
                    </button>
                  </div>
                </div>

                <div className="personal-list">
                  {personalResources.length > 0 ? (
                    personalResources.map(res => (
                      <a
                        key={res.id}
                        href={res.file_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.8rem',
                          background: 'var(--card-bg)',
                          border: '1px dashed var(--border-color)',
                          borderRadius: '10px',
                          textDecoration: 'none',
                          color: 'var(--primary-blue)',
                          marginBottom: '0.6rem',
                          fontSize: '0.85rem'
                        }}
                      >
                        <span style={{ fontSize: '1.1rem' }}>☁️</span>
                        <div style={{ flex: 1, fontWeight: '700' }}>{res.file_title}</div>
                        <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>View</span>
                      </a>
                    ))
                  ) : (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)', textAlign: 'center', padding: '1.5rem', border: '1px dashed var(--border-color)', borderRadius: '12px' }}>
                      You haven't uploaded any private study materials for this training yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default Player;

import React, { useState, useEffect, useRef } from 'react';
import './Learning.css';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { FiHeart, FiBookmark, FiMessageCircle, FiShare2, FiUser } from "react-icons/fi";

const VideoCard = ({ lesson, isActive }) => {
  const [likes, setLikes] = useState(lesson.likes || 0);
  const [comments, setComments] = useState(lesson.comments || 0);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);

  const handleInteract = async (action) => {
    if (action === "like" && liked) return; // Prevent double like

    try {
      await api.post(`/short-lessons/${lesson.id}/interact`, { action });
      if (action === "like") {
        setLiked(true);
        setLikes(likes + 1);
      } else if (action === "comment") {
        setComments(comments + 1);
      }
    } catch (err) {
      console.error("Failed to interact:", err);
    }
  };

  const isYouTube = lesson.video_url.includes('youtube.com') || lesson.video_url.includes('youtu.be');
  const getEmbedUrl = (url) => {
    if (isYouTube) {
      const id = url.split('v=')[1] || url.split('/').pop();
      return `https://www.youtube.com/embed/${id}?autoplay=${isActive ? 1 : 0}&mute=0&controls=0&modestbranding=1&loop=1&playlist=${id}`;
    }
    return url;
  };

  return (
    <div className="edu-card-full">
      {isYouTube ? (
        <iframe
          className="edu-video"
          src={getEmbedUrl(lesson.video_url)}
          title={lesson.title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      ) : (
        <video
          className="edu-video"
          src={lesson.video_url}
          loop
          muted={!isActive}
          autoPlay={isActive}
          playsInline
        />
      )}

      {/* --- OVERLAY UI --- */}
      <div className="edu-overlay">
        {/* LEFT SIDE INFO */}
        <div className="edu-left-info">
          <div className="category-tag">{lesson.category}</div>
          <h3>{lesson.title}</h3>
          <p>{lesson.description}</p>
          <div className="instructor-row">
            <div className="mini-avatar"><FiUser size={16} /></div>
            <span>{lesson.instructor}</span>
          </div>
        </div>

        {/* RIGHT SIDE ACTIONS */}
        <div className="edu-right-actions">
          <div className="action-btn" onClick={() => handleInteract("like")}>
            <span className={`icon ${liked ? 'active' : ''}`}><FiHeart size={24} style={{ fill: liked ? 'currentColor' : 'none' }} /></span>
            <span className="count">{likes}</span>
          </div>
          <div className="action-btn" onClick={() => setSaved(!saved)}>
            <span className={`icon ${saved ? 'active' : ''}`}><FiBookmark size={24} style={{ fill: saved ? 'currentColor' : 'none' }} /></span>
            <span className="label">Save</span>
          </div>
          <div className="action-btn" onClick={() => handleInteract("comment")}>
            <span className="icon"><FiMessageCircle size={24} /></span>
            <span className="count">{comments}</span>
          </div>
          <div className="action-btn" onClick={() => handleInteract("share")}>
            <span className="icon"><FiShare2 size={24} /></span>
            <span className="label">Share</span>
          </div>
        </div>

        {/* BOTTOM PROGRESS */}
        <div className="edu-progress-container">
          <div className="edu-progress-fill" style={{ width: isActive ? '100%' : '0%', transition: 'width 20s linear' }}></div>
        </div>
      </div>

      {/* --- QUIZ POPUP --- */}
      {showQuiz && (
        <div className="quiz-popup-overlay">
          <div className="quiz-card">
            <h3>Quick Class Quiz 🎯</h3>
            <p>{lesson.quiz_quest}</p>
            <div className="quiz-options">
              {(lesson.quiz_options || "").split(',').map((opt, i) => (
                <button key={i} className="quiz-opt-btn" onClick={() => setShowQuiz(false)}>
                  {opt}
                </button>
              ))}
            </div>
            <div className="quiz-reward">Earn +50 XP on completion</div>
          </div>
        </div>
      )}
    </div>
  );
};

const Learning = (props) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const res = await api.get('/short-lessons');
        setLessons(res.data);
      } catch (err) {
        console.error("Error fetching lessons", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLessons();
  }, []);

  const handleScroll = (e) => {
    const scrollPos = e.target.scrollTop;
    const height = e.target.clientHeight;
    const index = Math.round(scrollPos / height);
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  return (
    <div className="edu-learning-page">

      <div
        className="edu-container"
        ref={containerRef}
        onScroll={handleScroll}
      >
        {loading ? (
          <div style={{ color: 'white', textAlign: 'center', marginTop: '50vh' }}>Loading...</div>
        ) : lessons.map((lesson, index) => (
          <VideoCard
            key={lesson.id}
            lesson={lesson}
            isActive={index === activeIndex}
            onComplete={(id) => console.log('Lesson completed:', id)}
          />
        ))}
      </div>

      {/* FLOATING INSTRUCTION */}
      <div className="edu-hint">
        Swipe up for next lesson 👆
      </div>
    </div>
  );
};

export default Learning;

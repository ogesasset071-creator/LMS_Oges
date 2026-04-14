import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import {
  FiCheckCircle,
  FiFileText,
  FiAward,
  FiArrowLeft,
  FiClock,
  FiAlertCircle,
  FiCheck,
  FiSend,
  FiZap,
  FiBox,
  FiDownload,
  FiArrowRight
} from "react-icons/fi";
import Swal from "sweetalert2";
import "./AssignmentDetails.css";

const AssignmentDetails = ({ handleUpdateUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  // Proctoring States
  const [warningsCount, setWarningsCount] = useState(0);
  const [isRestricted, setIsRestricted] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await api.get(`/user/assignments/${id}`);
        setAssignment(res.data);
      } catch (e) {
        console.error("Error fetching assignment", e);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  // Proctoring Effects
  useEffect(() => {
    if (!loading && !result && assignment) {
      if(document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(()=>{});
      }
      setIsRestricted(true);
      
      const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            Swal.fire({
                icon: "error",
                title: "Camera Required",
                text: "Please allow camera access.",
                background: "var(--card-bg)"
            });
        }
      };
      startCamera();
    }
  }, [loading, result, assignment]);

  useEffect(() => {
    if (!isRestricted) return;

    const handleViolation = (reason) => {
        setWarningsCount(prev => {
            const newCount = prev + 1;
            Swal.fire({
                icon: "warning",
                title: "Violation Detected!",
                text: `${reason}. This is warning ${newCount}/3.`,
                confirmButtonColor: "#ef4444",
                background: "var(--card-bg)"
            }).then(() => {
                if (newCount >= 3 && !submitting) {
                    Swal.fire({ title: "Locked", text: "Submitting assignment...", icon: "error" });
                    handleSubmit();
                }
            });
            return newCount;
        });
    };

    const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') handleViolation("You left the assessment page");
    };

    const handleBlur = () => {
        handleViolation("Window focus lost");
    };

    const handleKeyDown = (e) => {
        if (e.key === "PrintScreen" || (e.metaKey && e.shiftKey && (e.key === "s" || e.key === "S"))) {
            e.preventDefault();
            navigator.clipboard.writeText("Screenshots are disabled for this assignment.");
            handleViolation("Screenshot shortcut detected");
        }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        window.removeEventListener("blur", handleBlur);
        document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isRestricted, submitting]);

  const cleanupProctoring = () => {
      setIsRestricted(false);
      if (document.exitFullscreen) document.exitFullscreen().catch(()=>{});
      if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
          streamRef.current = null;
      }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await api.post(`/user/assignments/${id}/complete`);
      if (res.data.status === "success" || res.data.status === "already_done") {
        setResult({
          status: "success",
          badge: assignment.reward_badge,
          xp: 50,
          pp: assignment.pp_reward || 100,
          message: res.data.status === "already_done"
            ? "You have already mastered this challenge!"
            : "Exceptional performance! You've successfully finished the assessment."
        });

        if (res.data.status === "success") {
          const userRes = await api.get("/user/me");
          if (handleUpdateUser) handleUpdateUser(userRes.data);
        }
        cleanupProctoring();
      }
    } catch (e) {
      console.error(e);
      alert("Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="initializing-container">
        <div className="premium-spinner-large"></div>
        <p className="initializing-text">INITIALIZING ASSESSMENT...</p>
      </div>
    );
  }

  if (!assignment) return (
    <div className="initializing-container">
      <FiAlertCircle size={48} />
      <h2 className="assignment-main-title">Assignment Not Found</h2>
    </div>
  );

  if (result) {
    return (
      <div className="result-screen-container">
        <div className="result-card-premium">
          <div className="result-icon-wrapper">
            <FiCheckCircle size={60} />
          </div>
          <h1 className="result-title">Assessment Complete</h1>
          <p className="result-description">{result.message}</p>

          <div className="result-stats-grid">
            <div className="result-stat-item">
              <span className="stat-label-mini">XP Earned</span>
              <div className="stat-value-large">+{result.xp}</div>
            </div>
            <div className="result-stat-item">
              <span className="stat-label-mini">PP Awarded</span>
              <div className="stat-value-large">+{result.pp}</div>
            </div>
          </div>

          <button
            className="btn-submit-assessment"
            onClick={() => navigate('/dashboard')}
          >
            RETURN TO DASHBOARD
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="assignment-details-page">
      {isRestricted && (
        <div style={{ position: 'fixed', top: '80px', right: '20px', width: '150px', height: '110px', borderRadius: '8px', overflow: 'hidden', border: '3px solid #ef4444', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', zIndex: 9999 }}>
            <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(239,68,68,0.9)', color: 'white', fontSize: '0.65rem', textAlign: 'center', fontWeight: 'bold', padding: '3px 0' }}>PROCTORED</div>
        </div>
      )}
      <div className="assignment-content-wrapper">
        <header className="assignment-header">
          <button
            className="back-btn-premium"
            onClick={() => {
              if(isRestricted) {
                Swal.fire({
                    title: "Leave Assessment?",
                    text: "Your progress may be lost.",
                    icon: "warning",
                    showCancelButton: true
                }).then((r) => { 
                    if(r.isConfirmed) { cleanupProctoring(); navigate(-1); }
                });
              } else {
                navigate(-1);
              }
            }}
          >
            <FiArrowLeft /> Back
          </button>

          <div className="assignment-title-area">
            <div>
              <div className="assignment-badges">
                <span className="category-badge">
                  {assignment.category || 'Core Training'}
                </span>
                <span className="level-badge">
                  {assignment.level || 'Professional'}
                </span>
              </div>
              <h1 className="assignment-main-title">{assignment.title}</h1>
              <p className="assignment-desc">
                {assignment.description || 'Complete this assessment to demonstrate your understanding of the module.'}
              </p>
            </div>

            <div className="assignment-reward-card">
              <div className="reward-label">Reward</div>
              <div className="reward-value">{assignment.pp_reward || 100} PP</div>
            </div>
          </div>
        </header>

        <section className="questions-list">
          {assignment.questions && assignment.questions.length > 0 ? (
            assignment.questions.map((q, idx) => (
              <div key={idx} className="question-card">
                <div className="question-flex">
                  <div className="question-number">
                    {idx + 1}
                  </div>
                  <div className="question-body">
                    <h2 className="question-text">{q.question}</h2>

                    {q.question_type === 'mcq' || q.question_type === 'checkbox' ? (
                      <div className="options-grid">
                        {(Array.isArray(q.options) ? q.options : (q.options || "").split(",")).map((opt, oIdx) => (
                          <label key={oIdx} className={`option-label ${answers[idx] === String(oIdx) ? 'selected' : ''}`}>
                            <input
                              type={q.question_type === 'mcq' ? 'radio' : 'checkbox'}
                              name={`q-${idx}`}
                              className="option-input"
                              checked={answers[idx] === String(oIdx)}
                              onChange={() => setAnswers({ ...answers, [idx]: String(oIdx) })}
                            />
                            {opt}
                          </label>
                        ))}
                      </div>
                    ) : (
                      <textarea
                        className="answer-textarea"
                        placeholder="Your answer here..."
                        value={answers[idx] || ""}
                        onChange={(e) => setAnswers({ ...answers, [idx]: e.target.value })}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="initializing-container" style={{ height: 'auto', padding: '4rem 2rem', border: '1px dashed var(--border-color)', borderRadius: '12px' }}>
              <h3 className="result-title">Standard Verification</h3>
              <p className="result-description" style={{ maxWidth: '400px', margin: '0 auto 2rem' }}>
                Ready to finalize your progress for this module?
              </p>
              <button
                className="btn-submit-assessment"
                style={{ margin: '0 auto' }}
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "VERIFYING..." : "FINALIZE MODULE"}
              </button>
            </div>
          )}

          {assignment.questions && assignment.questions.length > 0 && (
            <div className="submit-area">
              <button
                className="btn-submit-assessment"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'PROCESSING...' : <><FiSend /> SUBMIT ASSESSMENT</>}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AssignmentDetails;

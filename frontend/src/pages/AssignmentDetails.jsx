import { useState, useEffect } from "react";
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
import "./AssignmentDetails.css";

const AssignmentDetails = ({ handleUpdateUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await api.get(`/assignments/${id}`);
        setAssignment(res.data);
      } catch (e) {
        console.error("Error fetching assignment", e);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await api.post(`/assignments/${id}/complete`);
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
      <div className="assignment-content-wrapper">
        <header className="assignment-header">
          <button
            className="back-btn-premium"
            onClick={() => navigate(-1)}
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

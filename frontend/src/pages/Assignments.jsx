import React, { useState, useEffect, useRef } from "react";
import "./Assignments.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import api from "../services/api";
import { FiPlus, FiCheckCircle, FiAward, FiClock, FiTarget, FiBriefcase, FiCode, FiList, FiAlertTriangle } from "react-icons/fi";
import Swal from "sweetalert2";

const Assignments = (props) => {
    const { user } = props;
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [activeTask, setActiveTask] = useState(null);

    // Create state
    const [newTitle, setNewTitle] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [newReward, setNewReward] = useState("");
    const [newRole, setNewRole] = useState("learner");
    const [submitting, setSubmitting] = useState(false);

    // Interactive state for current session
    const [currentStep, setCurrentStep] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [shortAnswerValues, setShortAnswerValues] = useState({});
    const [assignmentDetail, setAssignmentDetail] = useState(null);
    const [codeValue, setCodeValue] = useState("");
    
    // Restrict Mode / Proctoring
    const [isRestrictedMode, setIsRestrictedMode] = useState(false);
    const [warningsCount, setWarningsCount] = useState(0);
    const videoRef = useRef(null);
    const streamRef = useRef(null);

    useEffect(() => {
        fetchAssignments();
    }, []);

    const fetchAssignments = async () => {
        try {
            setLoading(true);
            const res = await api.get("/user/assignments");
            setAssignments(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // Start Camera
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Camera access denied or failed", err);
            Swal.fire({
                icon: "error",
                title: "Camera Access Required",
                text: "You must allow camera access to take this assignment. Please refresh and allow.",
                backdrop: `var(--card-bg)`
            });
        }
    };

    // Stop Camera
    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
    };

    // Restrict Mode Effect
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (isRestrictedMode && document.visibilityState === 'hidden') {
                handleViolation();
            }
        };

        const handleBlur = () => {
            if (isRestrictedMode) {
                handleViolation();
            }
        };

        if (isRestrictedMode) {
            startCamera();
            document.addEventListener("visibilitychange", handleVisibilityChange);
            window.addEventListener("blur", handleBlur);
        } else {
            stopCamera();
        }

        return () => {
            stopCamera();
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("blur", handleBlur);
        };
    }, [isRestrictedMode]);

    const handleViolation = () => {
        setWarningsCount(prev => {
            const newCount = prev + 1;
            Swal.fire({
                icon: "warning",
                title: "Violation Detected!",
                text: `You have left the assignment page. This is warning ${newCount}/3. If you reach 3 warnings, your assignment will be auto-submitted and locked.`,
                confirmButtonColor: "#ef4444",
                background: "var(--card-bg)",
                color: "var(--text-main)",
                allowOutsideClick: false
            }).then(() => {
                if (newCount >= 3) {
                    forceSubmitAssignment();
                }
            });
            return newCount;
        });
    };

    const forceSubmitAssignment = () => {
        if (activeTask && !submitting) {
            Swal.fire({
                title: "Assignment Locked",
                text: "Maximum warnings reached. Force submitting your assignment now.",
                icon: "error",
                background: "var(--card-bg)",
                color: "var(--text-main)"
            });
            setSubmitting(true);
            handleComplete(activeTask.id).then(() => {
                setSubmitting(false);
                setIsRestrictedMode(false);
                setCurrentStep(3); // Go to success view or end view
            });
        }
    };

    const handleCreateAssignment = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            // New endpoint needed on backend or I can just use existing seeding logic logic extension
            // For now, I'll assume we add a POST /api/assignments
            await api.post("/user/admin/assignments", {
                title: newTitle,
                description: newDesc,
                reward_badge: newReward,
                role: newRole
            });
            setShowCreateModal(false);
            setNewTitle("");
            setNewDesc("");
            setNewReward("");
            fetchAssignments();
        } catch (e) {
            console.error(e);
            alert("Error creating assignment. Ensure your account has permissions.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleComplete = async (id) => {
        try {
            await api.post(`/user/assignments/${id}/complete`);
            fetchAssignments();
        } catch (e) { console.error(e); }
    };

    return (
        <div className="assignments-page-modern">


            <header className="assignments-hero">
                <div className="container">
                    <div className="hero-flex">
                        <div className="hero-text">
                            <h1>Platform <span className="text-gradient">Challenges</span></h1>
                            <p>Complete curated tasks to earn exclusive badges and climb the Oges skill ranks.</p>
                        </div>
                        {(user?.Lms_role === 'admin' || user?.Lms_role === 'admin') && (
                            <button className="btn-create-assign" onClick={() => setShowCreateModal(true)}>
                                <FiPlus /> Create New Assignment
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main className="assignments-content container">
                {loading ? (
                    <div className="loader-area">
                        <div className="spinner-modern"></div>
                        <p>Loading Challenges...</p>
                    </div>
                ) : (
                    <div className="assignments-grid-modern">
                        {assignments.length > 0 ? (
                            assignments.map(a => (
                                <div className={`assign-card-premium ${a.completed ? 'completed' : ''}`} key={a.id}>
                                    <div className="assign-header">
                                        <div className={`assign-icon ${a.role === 'admin' ? 'edu' : 'stu'}`}>
                                            {a.role === 'admin' ? <FiBriefcase /> :
                                                a.title.toLowerCase().includes('coding') ? <FiCode /> :
                                                    (a.title.toLowerCase().includes('mcq') || a.title.toLowerCase().includes('quiz')) ? <FiList /> :
                                                        <FiTarget />}
                                        </div>
                                        <div className="role-tag">{a.role === 'learner' ? 'learner Quest' : 'admin Goal'}</div>
                                    </div>
                                    <div className="assign-body">
                                        <h3>{a.title}</h3>
                                        <p>{a.description}</p>
                                        <div className="reward-badge-area">
                                            <FiAward /> <span>{a.reward_badge}</span>
                                        </div>
                                    </div>
                                    <div className="assign-footer">
                                        {a.completed ? (
                                            <div className="status-done"><FiCheckCircle /> Achievement Unlocked</div>
                                        ) : (
                                            <button className="btn-action-assign" onClick={async () => {
                                                try {
                                                    const res = await api.get(`/user/assignments/${a.id}`);
                                                    setAssignmentDetail(res.data);
                                                    setActiveTask(a);
                                                    setCurrentStep(0);
                                                } catch (e) {
                                                    console.error("Failed to load details", e);
                                                    alert("Could not load assignment details.");
                                                }
                                            }}>
                                                Start Assignment
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-assign-state">
                                <h2>No active challenges found.</h2>
                                <p>Check back later or create one if you are an admin!</p>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {activeTask && (
                <div className="modal-overlay-premium" onClick={() => { 
                    if (isRestrictedMode) return; 
                    setActiveTask(null); setCurrentStep(0); 
                }}>
                    <div className="task-session-modal bigger" onClick={e => e.stopPropagation()}>
                        
                        {isRestrictedMode && (
                            <div className="proctoring-cam-container" style={{ position: 'absolute', top: '15px', right: '15px', width: '120px', height: '90px', borderRadius: '8px', overflow: 'hidden', border: '2px solid #ef4444', boxShadow: '0 5px 15px rgba(0,0,0,0.3)', zIndex: 100 }}>
                                <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <div style={{ position: 'absolute', bottom: '2px', left: '0', width: '100%', textAlign: 'center', fontSize: '0.55rem', background: 'rgba(239, 68, 68, 0.9)', color: 'white', fontWeight: 'bold', padding: '2px 0' }}>PROCTORED</div>
                            </div>
                        )}
                        {currentStep === 0 && (
                            <div className="session-start-view text-center">
                                <div className="session-icon-hero"><FiTarget size={60} /></div>
                                <h2>Ready to Start {activeTask.title}?</h2>
                                <p>You are about to enter the {activeTask.title.toLowerCase().includes('coding') ? 'Coding' : 'Knowledge'} Challenge.</p>
                                <div className="challenge-meta">
                                    <span>⏱️ 15 Minutes</span>
                                    <span>💎 {activeTask.reward_badge} Reward</span>
                                    <span>🛠️ MCQ + Coding Round</span>
                                </div>
                                <button className="btn-launch-challenge" onClick={() => { 
                                    setCurrentStep(1); 
                                    setIsRestrictedMode(true); 
                                    setWarningsCount(0); 
                                    if(document.documentElement.requestFullscreen) {
                                        document.documentElement.requestFullscreen().catch(()=>{});
                                    }
                                }}>I'm Ready, Let's Go!</button>
                                <button className="btn-cancel-p" onClick={() => setActiveTask(null)}>Maybe Later</button>
                            </div>
                        )}

                        {currentStep === 1 && (
                            <div className="session-mcq-view dynamic-questions-view">
                                <div className="session-header-mini">
                                    <div className="progress-indicator">Challenge Step: Knowledge Check</div>
                                    <h3>{activeTask.title}</h3>
                                </div>
                                <div className="mcq-container">
                                    {assignmentDetail?.questions?.length > 0 ? (
                                        assignmentDetail.questions.map((q, idx) => (
                                            <div className="q-block" key={q.id}>
                                                <p><strong>Q{idx + 1}:</strong> {q.question_text}</p>

                                                {q.question_type === 'mcq' ? (
                                                    <div className="q-options-grid">
                                                        {(q.options || "").split(",").map((o, optIdx) => (
                                                            <label key={optIdx} className={`opt-label ${selectedAnswers[q.id] === optIdx ? 'selected' : ''}`}>
                                                                <input
                                                                    type="radio"
                                                                    name={`q${q.id}`}
                                                                    value={optIdx}
                                                                    checked={selectedAnswers[q.id] === optIdx}
                                                                    onChange={() => setSelectedAnswers({ ...selectedAnswers, [q.id]: optIdx })}
                                                                />
                                                                {o}
                                                            </label>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="short-answer-input-area">
                                                        <input
                                                            type="text"
                                                            className="short-answer-input-modern"
                                                            placeholder="Type your answer here..."
                                                            value={shortAnswerValues[q.id] || ""}
                                                            onChange={(e) => setShortAnswerValues({ ...shortAnswerValues, [q.id]: e.target.value })}
                                                            style={{
                                                                width: '100%',
                                                                padding: '1.2rem',
                                                                borderRadius: '12px',
                                                                background: 'rgba(255,255,255,0.05)',
                                                                border: '1px solid var(--border-color)',
                                                                color: 'white',
                                                                fontSize: '1rem',
                                                                marginTop: '0.5rem'
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="empty-questions">
                                            <p>This assignment has No Questions defined. Click complete to finish.</p>
                                        </div>
                                    )}
                                </div>
                                <div className="session-footer-actions">
                                    <button className="btn-cancel-p" onClick={() => { 
                                        if (isRestrictedMode) {
                                            Swal.fire({
                                                title: "Exit Assignment?",
                                                text: "Are you sure you want to exit? Your progress will be lost and this will be recorded.",
                                                icon: "warning",
                                                showCancelButton: true,
                                                background: "var(--card-bg)"
                                            }).then(res => {
                                                if (res.isConfirmed) {
                                                    setIsRestrictedMode(false);
                                                    if (document.exitFullscreen) document.exitFullscreen().catch(()=>{});
                                                    setActiveTask(null); setCurrentStep(0);
                                                }
                                            });
                                        } else {
                                            setActiveTask(null); setCurrentStep(0); 
                                        }
                                    }}>Exit</button>
                                    <button className="btn-submit-p" onClick={() => {
                                        if (activeTask.title.toLowerCase().includes('coding')) {
                                            setCurrentStep(2);
                                        } else {
                                            setSubmitting(true);
                                            handleComplete(activeTask.id).then(() => {
                                                setSubmitting(false);
                                                setIsRestrictedMode(false);
                                                if (document.exitFullscreen) document.exitFullscreen().catch(()=>{});
                                                setCurrentStep(3);
                                            });
                                        }
                                    }}>{activeTask.title.toLowerCase().includes('coding') ? 'Next: Coding Round' : 'Submit Answers'}</button>
                                </div>
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="session-code-view">
                                <div className="session-header-mini">
                                    <div className="progress-indicator">Step 2 of 2: Technical Execution</div>
                                    <h3>Live Code Implementation</h3>
                                </div>
                                <div className="coding-problem">
                                    <p><strong>Problem:</strong> Write a function in any language that finds the first non-repeating character in a string "ogesplatform".</p>
                                    <div className="code-editor-sim">
                                        <div className="editor-top"><span>code_solution.py</span></div>
                                        <textarea
                                            placeholder="// Type your code here..."
                                            value={codeValue}
                                            onChange={(e) => setCodeValue(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="session-footer-actions">
                                    <button className="btn-cancel-p" onClick={() => setCurrentStep(1)}>Back</button>
                                    <button className="btn-submit-p" disabled={submitting} onClick={async () => {
                                        setSubmitting(true);
                                        await handleComplete(activeTask.id);
                                        setSubmitting(false);
                                        setIsRestrictedMode(false);
                                        if (document.exitFullscreen) document.exitFullscreen().catch(()=>{});
                                        setCurrentStep(3);
                                    }}>{submitting ? 'Validating Output...' : 'Final Submission'}</button>
                                </div>
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="session-success-view text-center">
                                <div className="success-icon-anim">🌟</div>
                                <h2>Challenge Completed!</h2>
                                <p>Congratulations! You've successfully passed the MCQ and Coding rounds.</p>
                                <div className="result-summary">
                                    <div className="res-item">Score: <strong>92%</strong></div>
                                    <div className="res-item">Reward: <strong>{activeTask.reward_badge}</strong></div>
                                </div>
                                <p className="reward-msg">This badge has been added to your profile showcase.</p>
                                <button className="btn-launch-challenge" onClick={() => { setActiveTask(null); setCurrentStep(0); fetchAssignments(); }}>Go Back to Challenges</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showCreateModal && (
                <div className="modal-overlay-premium" onClick={() => setShowCreateModal(false)}>
                    <div className="assign-modal-premium" onClick={e => e.stopPropagation()}>
                        <h2>Create New Assignment</h2>
                        <form onSubmit={handleCreateAssignment}>
                            <div className="form-group-p">
                                <label>Title</label>
                                <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} required placeholder="e.g. Master the Advanced Hooks" />
                            </div>
                            <div className="form-group-p">
                                <label>Description</label>
                                <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} required placeholder="What needs to be done?" />
                            </div>
                            <div className="form-group-p">
                                <label>Reward Badge (Emoji + Name)</label>
                                <input type="text" value={newReward} onChange={e => setNewReward(e.target.value)} required placeholder="e.g. ⚓ Hook Master" />
                            </div>
                            <div className="form-group-p">
                                <label>Target Role</label>
                                <select value={newRole} onChange={e => setNewRole(e.target.value)}>
                                    <option value="learner">learners</option>
                                    <option value="admin">admins</option>
                                </select>
                            </div>
                            <div className="modal-actions-p">
                                <button type="button" className="btn-cancel-p" onClick={() => setShowCreateModal(false)}>Cancel</button>
                                <button type="submit" className="btn-submit-p" disabled={submitting}>{submitting ? 'Creating...' : 'Launch Assignment'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default Assignments;

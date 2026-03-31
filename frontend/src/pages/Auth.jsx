import React, { useState } from 'react';
import './Auth.css';
import { FiBookOpen, FiBriefcase, FiSun, FiMoon } from "react-icons/fi";
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from "../services/api";
import logo from "../assets/Compaylogo.png";

const Auth = ({ onAuthSuccess, initialIsLogin = true, isDarkMode, onToggleTheme }) => {
    const [isLogin, setIsLogin] = useState(initialIsLogin);
    const [role, setRole] = useState('learner');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [onboardingStep, setOnboardingStep] = useState('role'); // 'role', 'category', 'form'
    const [category, setCategory] = useState('');
    const [showCustomCat, setShowCustomCat] = useState(false);
    const [customCatValue, setCustomCatValue] = useState('');
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const toggleAuth = () => {
        setShowForgotPassword(false);
        setSuccessMessage('');
        setError('');
        if (isLogin) {
            // Switching to signup
            setOnboardingStep('role');
        }
        setIsLogin(!isLogin);
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setLoading(true);

        try {
            const res = await api.post('/auth/forgot-password', { email });
            setSuccessMessage(res.data.message);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to send reset link.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                const res = await api.post('/auth/login', { email, password });
                localStorage.setItem('token', res.data.access_token);
                localStorage.setItem('user', JSON.stringify(res.data));
                onAuthSuccess(res.data);
            } else {
                const res = await api.post('/auth/signup', { full_name: fullName, email, password, role, category });
                localStorage.setItem('token', res.data.access_token);
                localStorage.setItem('user', JSON.stringify(res.data));
                onAuthSuccess(res.data);
            }
        } catch (err) {
            setError(err.response?.data?.detail || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-wrapper">
            <button
                className="theme-toggle-auth"
                onClick={onToggleTheme}
                aria-label="Toggle Theme"
            >
                {isDarkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
            </button>
            <main className="auth-container">
                <div className="auth-visual-panel">
                    <div className="visual-top-brand">
                        <img src={logo} alt="Oges" className="auth-panel-logo" />
                        <span className="brand-divider">|</span>
                        <span className="brand-subname">LMS</span>
                    </div>
                    
                    <div className="visual-hero-text">
                        <h2>Master Your Skills, <br/>Lead Your Future.</h2>
                        <p>The premier high-performance learning platform designed to help you track progress, earn certifications, and scale your expertise effortlessly.</p>
                    </div>

                    <div className="visual-bottom-card">
                        <div className="security-badge">
                            <strong>Platform Security</strong>
                            <p>Verified academic credentialing with encrypted student progress tracking protocol.</p>
                        </div>
                    </div>
                </div>

                <div className="auth-form-panel">
                    <div className="form-container-premium">
                        <div className="auth-header-section">
                            <h1>{isLogin ? 'Oges LMS Portal' : 'Start Your Journey'}</h1>
                            <p className="auth-subtitle">{isLogin ? 'Sign in to access your modules and certifications' : 'Create your professional account and join our learner community'}</p>
                        </div>

                        {error && <div className="auth-alert alert-error">{error}</div>}
                        {successMessage && <div className="auth-alert alert-success">{successMessage}</div>}

                         {showForgotPassword ? (
                            <div className="forgot-password-flow">
                                <h2>Recover Password</h2>
                                <p className="onboarding-desc">Enter your email and we'll send you a link to reset your password.</p>
                                <form className="auth-main-form" onSubmit={handleForgotPassword}>
                                    <div className="input-field-group">
                                        <label htmlFor="reset-email">Email Address</label>
                                        <input 
                                            id="reset-email" 
                                            type="email" 
                                            placeholder="name@example.com" 
                                            value={email} 
                                            onChange={(e) => setEmail(e.target.value)} 
                                            required 
                                        />
                                    </div>
                                    <button type="submit" className="submit-auth-btn" disabled={loading}>
                                        {loading ? 'Sending...' : 'Send Reset Link'}
                                    </button>
                                </form>
                                <div className="form-toggle-footer">
                                    <button className="switch-auth-link" onClick={() => setShowForgotPassword(false)}>
                                        Back to Login
                                    </button>
                                </div>
                            </div>
                        ) : !isLogin && onboardingStep === 'role' ? (
                            <div className="onboarding-role-selection">
                                <h2>How will you use Oges?</h2>
                                <p className="onboarding-desc">Choose your path to get started with a personalized experience.</p>
                                <div className="role-cards-grid">
                                    <div className={`role-card-premium ${role === 'learner' ? 'active' : ''}`} onClick={() => { setRole('learner'); setOnboardingStep('category'); }}>
                                        <div className="role-card-icon"><FiBookOpen /></div>
                                        <div className="role-card-info">
                                            <h3>I am a Learner</h3>
                                            <p>Access world-class trainings and earn certifications.</p>
                                        </div>
                                    </div>
                                    <div className={`role-card-premium ${role === 'admin' ? 'active' : ''}`} onClick={() => { setRole('admin'); setOnboardingStep('form'); }}>
                                        <div className="role-card-icon"><FiBriefcase /></div>
                                        <div className="role-card-info">
                                            <h3>I am an Admin</h3>
                                            <p>Work with students globally and manage content.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : !isLogin && onboardingStep === 'category' ? (
                            <div className="onboarding-category-selection">
                                <h2>What are you interested in?</h2>
                                <p className="onboarding-desc">Help us personalize your learning path.</p>
                                <div className="category-grid-chips">
                                    {[
                                        { id: 'Frontend Development', icon: '🎨' },
                                        { id: 'Backend Development', icon: '⚙️' },
                                        { id: 'Full Stack Development', icon: '🌐' },
                                        { id: 'Data Science', icon: '📊' },
                                        { id: 'Data Analytics', icon: '📈' },
                                        { id: 'Artificial Intelligence', icon: '🤖' },
                                        { id: 'Machine Learning', icon: '🧠' },
                                        { id: 'Cloud Computing', icon: '☁️' },
                                        { id: 'DevOps', icon: '♾️' },
                                        { id: 'Cyber Security', icon: '🔒' },
                                        { id: 'Mobile App Development', icon: '📱' },
                                        { id: 'UI/UX Design', icon: '🎨' },
                                        { id: 'Database Management', icon: '🖥️' },
                                        { id: 'Software Testing', icon: '🧪' },
                                        { id: 'Game Development', icon: '🎮' },
                                        { id: 'Blockchain Development', icon: '⛓️' },
                                        { id: 'Internet of Things (IoT)', icon: '📡' },
                                        { id: 'AR/VR Development', icon: '🥽' },
                                        { id: 'Networking', icon: '🌐' },
                                        { id: 'System Design', icon: '🏗️' },
                                    ].map(cat => (
                                        <div 
                                            key={cat.id} 
                                            className={`category-chip-premium ${category === cat.id ? 'active' : ''}`}
                                            onClick={() => { setCategory(cat.id); setShowCustomCat(false); setOnboardingStep('form'); }}
                                        >
                                            <span className="cat-icon-mini">{cat.icon}</span>
                                            <span className="cat-label-mini">{cat.id}</span>
                                        </div>
                                    ))}
                                    <div 
                                        className={`category-chip-premium ${showCustomCat ? 'active' : ''}`}
                                        onClick={() => setShowCustomCat(true)}
                                    >
                                        <span className="cat-icon-mini">✨</span>
                                        <span className="cat-label-mini">Other</span>
                                    </div>
                                </div>

                                {showCustomCat && (
                                    <div className="custom-category-input-area">
                                        <input 
                                            type="text" 
                                            placeholder="What would you like to learn?" 
                                            value={customCatValue}
                                            onChange={(e) => setCustomCatValue(e.target.value)}
                                            autoFocus
                                        />
                                        <button 
                                            className="btn-continue-custom"
                                            disabled={!customCatValue.trim()}
                                            onClick={() => { 
                                                setCategory(customCatValue); 
                                                setOnboardingStep('form'); 
                                            }}
                                        >
                                            Continue
                                        </button>
                                    </div>
                                )}

                                <div className="onboarding-footer-actions">
                                    <button className="btn-skip-cat" onClick={() => { setCategory('General'); setOnboardingStep('form'); }}>
                                        Skip for now
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {!isLogin && (
                                    <div className="form-back-role">
                                        <button className="btn-back-step" onClick={() => setOnboardingStep(role === 'learner' ? 'category' : 'role')}>
                                            ← Back
                                        </button>
                                    </div>
                                )}
                                <form className="auth-main-form" onSubmit={handleSubmit}>
                                    {!isLogin && (
                                        <div className="input-field-group">
                                            <label htmlFor="fullName">Full Name</label>
                                            <input id="fullName" type="text" placeholder="e.g. John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                                        </div>
                                    )}
                                    <div className="input-field-group">
                                        <label htmlFor="email">{isLogin ? 'IDENTIFIER' : 'Email Address'}</label>
                                        <input id="email" type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                                    </div>
                                    <div className="input-field-group">
                                        <div className="label-row">
                                            <label htmlFor="password">{isLogin ? 'PASSCODE' : 'Password'}</label>
                                            {isLogin && <button type="button" className="forgot-password-link-btn" onClick={() => setShowForgotPassword(true)}>Forgot?</button>}
                                        </div>
                                        <input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                                    </div>

                                    <button type="submit" className="submit-auth-btn" disabled={loading}>
                                        {loading ? (
                                            <span className="loader-dots">
                                                <span>.</span><span>.</span><span>.</span>
                                            </span>
                                        ) : (isLogin ? 'Establish Session' : 'Create Account')}
                                    </button>
                                </form>
                            </>
                        )}


                        <footer className="form-toggle-footer">
                            <p>
                                {isLogin ? "New to the platform?" : "Already have an account?"}
                                <button className="switch-auth-link" onClick={toggleAuth}>
                                    {isLogin ? 'Sign up' : 'Log in here'}
                                </button>
                            </p>
                        </footer>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Auth;


import React, { useState } from 'react';
import './Auth.css';
import { FiBookOpen, FiBriefcase, FiSun, FiMoon, FiEye, FiEyeOff } from "react-icons/fi";
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from "../services/api";
import logo from "../assets/OgesLogo.png";

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
    const [showPassword, setShowPassword] = useState(false);

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
            const res = await api.post('/auth/forgot-password', { Lms_email: email });
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
                const res = await api.post('/auth/login', { Lms_email: email, password });
                localStorage.setItem('token', res.data.access_token);
                localStorage.setItem('user', JSON.stringify(res.data));
                onAuthSuccess(res.data);
            } else {
                const res = await api.post('/auth/signup', { Lms_full_name: fullName, Lms_email: email, password, Lms_role: role, Lms_category: category });
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
            <div className="bg-blur-shapes">
                <div className="shape shape-1"></div>
                <div className="shape shape-2"></div>
                <div className="shape shape-3"></div>
            </div>
            <div className="theme-switch-container">
                <button
                    className={`theme-btn ${!isDarkMode ? 'active' : ''}`}
                    onClick={() => !isDarkMode ? null : onToggleTheme()}
                    aria-label="Light Mode"
                >
                    <FiSun size={18} />
                    <span>Light</span>
                </button>
                <button
                    className={`theme-btn ${isDarkMode ? 'active' : ''}`}
                    onClick={() => isDarkMode ? null : onToggleTheme()}
                    aria-label="Dark Mode"
                >
                    <FiMoon size={18} />
                    <span>Dark</span>
                </button>
            </div>
            <main className="auth-container">
                <div className="auth-visual-panel">
                    <div className="visual-top-brand">
                        <img src={logo} alt="Oges" className="auth-panel-logo" />
                        <span className="brand-divider">|</span>
                        <span className="brand-subname">LMS</span>
                    </div>
                    
                    <div className="visual-hero-text">
                        <h2>Oges Internal <br/>Learning Ecosystem.</h2>
                        <p>Our proprietary platform for workforce development. Access specialized modules, track professional milestones, and earn certifications recognized within the Oges network.</p>
                    </div>

                    <div className="visual-bottom-card">
                        <div className="security-badge">
                            <strong>Enterprise Access</strong>
                            <p>Authorized access only. Verified academic credentialing and encrypted progress tracking active.</p>
                        </div>
                    </div>
                </div>

                <div className="auth-form-panel">
                    <div className="form-container-premium">
                        <div className="auth-header-section">
                            <h1>{isLogin ? 'Oges Staff Portal' : 'Member Onboarding'}</h1>
                            <p className="auth-subtitle">{isLogin ? 'Authenticate to access your internal training and resources' : 'Join the Oges internal workforce development network'}</p>
                        </div>

                        {error && <div className="auth-alert alert-error">{error}</div>}
                        {successMessage && <div className="auth-alert alert-success">{successMessage}</div>}

                         {showForgotPassword ? (
                            <div className="forgot-password-flow">
                                <h2>Portal Access Recovery</h2>
                                <p className="onboarding-desc">Provide your registered Oges staff email to receive a secure recovery link.</p>
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
                                        {loading ? 'Processing...' : 'Send Recovery Link'}
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
                                <h2>Staff Role Identification</h2>
                                <p className="onboarding-desc">Identify your organizational role to configure your portal experience.</p>
                                <div className="role-cards-grid">
                                    <div className={`role-card-premium ${role === 'learner' ? 'active' : ''}`} onClick={() => { setRole('learner'); setOnboardingStep('category'); }}>
                                        <div className="role-card-icon"><FiBookOpen /></div>
                                        <div className="role-card-info">
                                            <h3>Standard Employee</h3>
                                            <p>Access assigned trainings, track project milestones, and earn certifications.</p>
                                        </div>
                                    </div>
                                    <div className={`role-card-premium ${role === 'admin' ? 'active' : ''}`} onClick={() => { setRole('admin'); setOnboardingStep('form'); }}>
                                        <div className="role-card-icon"><FiBriefcase /></div>
                                        <div className="role-card-info">
                                            <h3>Account Administrator</h3>
                                            <p>Manage workforce development, audit compliance, and supervise team progress.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : !isLogin && onboardingStep === 'category' ? (
                            <div className="onboarding-category-selection">
                                <h2>Skill Domain Specialization</h2>
                                <p className="onboarding-desc">Specify your primary area of operations within Oges.</p>
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
                                        <label htmlFor="email">{isLogin ? 'OGES STAFF EMAIL' : 'Work Email Address'}</label>
                                        <input id="email" type="email" placeholder="staff@oges.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                                    </div>
                                     <div className="input-field-group">
                                        <div className="label-row">
                                            <label htmlFor="password">{isLogin ? 'PORTAL SECURITY PASSWORD' : 'Set Strong Password'}</label>
                                            {isLogin && <button type="button" className="forgot-password-link-btn" onClick={() => setShowForgotPassword(true)}>Reset Key?</button>}
                                        </div>
                                        <div className="password-input-wrapper">
                                            <input 
                                                id="password" 
                                                type={showPassword ? "text" : "password"} 
                                                placeholder="••••••••" 
                                                value={password} 
                                                onChange={(e) => setPassword(e.target.value)} 
                                                required 
                                            />
                                            <button 
                                                type="button" 
                                                className="password-toggle-btn" 
                                                onClick={() => setShowPassword(!showPassword)}
                                                aria-label={showPassword ? "Hide password" : "Show password"}
                                            >
                                                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                            </button>
                                        </div>
                                    </div>

                                    <button type="submit" className="submit-auth-btn" disabled={loading}>
                                        {loading ? (
                                            <span className="loader-dots">
                                                <span>.</span><span>.</span><span>.</span>
                                            </span>
                                        ) : (isLogin ? 'Access Portal' : 'Join Oges')}
                                    </button>
                                </form>
                            </>
                        )}


                        <footer className="form-toggle-footer">
                            <p>
                                {isLogin ? "New to the Oges network?" : "Already part of Oges?"}
                                <button className="switch-auth-link" onClick={toggleAuth}>
                                    {isLogin ? 'Onboard here' : 'Log in here'}
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


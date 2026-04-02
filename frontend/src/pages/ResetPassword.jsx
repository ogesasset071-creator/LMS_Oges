import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Auth.css';
import api from "../services/api";
import logo from "../assets/OgesLogo.png";
import Footer from '../components/Footer';

const ResetPassword = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [token, setToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const query = new URLSearchParams(location.search);
        const t = query.get('token');
        if (t) {
            setToken(t);
        } else {
            setError('Invalid or missing reset token.');
        }
    }, [location]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/auth/reset-password', {
                token: token,
                new_password: newPassword
            });
            setMessage(res.data.message);
            setTimeout(() => {
                navigate('/auth');
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to reset password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-wrapper">
            <main className="auth-container" style={{ justifyContent: 'center' }}>
                <div className="auth-form-panel" style={{ width: '100%', maxWidth: '500px' }}>
                    <div className="form-container-glass">
                        <div className="auth-header-section" style={{ textAlign: 'center' }}>
                            <img src={logo} alt="Company Logo" style={{ height: '60px', marginBottom: '1.2rem' }} />
                            <h1>Reset Your Password</h1>
                            <p className="auth-subtitle">Enter your new password below to regain access to your account.</p>
                        </div>

                        {error && <div className="auth-alert alert-error">{error}</div>}
                        {message && <div className="auth-alert alert-success">{message} Redirecting to login...</div>}

                        {!message && (
                            <form className="auth-main-form" onSubmit={handleSubmit}>
                                <div className="input-field-group">
                                    <label htmlFor="newPassword">New Password</label>
                                    <input 
                                        id="newPassword" 
                                        type="password" 
                                        placeholder="••••••••" 
                                        value={newPassword} 
                                        onChange={(e) => setNewPassword(e.target.value)} 
                                        required 
                                    />
                                </div>
                                <div className="input-field-group">
                                    <label htmlFor="confirmPassword">Confirm New Password</label>
                                    <input 
                                        id="confirmPassword" 
                                        type="password" 
                                        placeholder="••••••••" 
                                        value={confirmPassword} 
                                        onChange={(e) => setConfirmPassword(e.target.value)} 
                                        required 
                                    />
                                </div>

                                <button type="submit" className="submit-auth-btn" disabled={loading || !token}>
                                    {loading ? 'Updating...' : 'Reset Password'}
                                </button>
                            </form>
                        )}

                        <footer className="form-toggle-footer">
                            <p>
                                <button className="switch-auth-link" onClick={() => navigate('/auth')}>
                                    Back to Login
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

export default ResetPassword;

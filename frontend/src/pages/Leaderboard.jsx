import React, { useState, useEffect } from 'react';
import './Leaderboard.css';
import Navbar from '../components/Navbar';
import api from '../services/api';

const Leaderboard = ({ onProfileClick, onHomeClick, onLeaderboardClick, onDashboardClick, onLogout, isDarkMode, onToggleTheme, isLoggedIn, user, sessionTime, onPulseClick, onExploreClick }) => {
  const [activeTab, setActiveTab] = useState('Global');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await api.get('/leaderboard');
        setUsers(res.data);
      } catch (e) {
        console.error('Error fetching leaderboard', e);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  // Map and inject rank
  const usersWithFlag = users.map((u, index) => ({
    ...u,
    rank: index + 1,
    name: u.Lms_full_name,
    isCurrentUser: u.Lms_email === user?.Lms_email,
  }));

  const top3 = usersWithFlag.slice(0, 3);
  const others = usersWithFlag.slice(3);

  // Find current user's data
  const currentUserData = usersWithFlag.find(u => u.isCurrentUser);

  // Avatar display helper
  const getAvatarDisplay = (u) => {
    if (u.Lms_avatar && u.Lms_avatar.startsWith('http')) {
      return <img src={u.Lms_avatar} alt={u.name} className="lb-avatar-img" />;
    }
    // Fallback to initials
    const initials = (u.name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    return <span className="lb-avatar-initials">{initials}</span>;
  };

  return (
    <div className="leader-page">


      <main className="leader-content">
        <header className="leader-header">
          <h1>Leaderboard 🏆</h1>
          <div className="leader-tabs">
            {['Global', 'Friends', 'Weekly'].map(tab => (
              <button
                key={tab}
                className={`l-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </header>

        {loading ? (
          <div className="lb-loading">
            <div className="lb-spinner"></div>
            <p>Loading leaderboard...</p>
          </div>
        ) : (
          <>
            {/* --- TOP 3 podium --- */}
            {top3.length > 0 && (
              <section className="podium-section">
                {/* Render in order: 2nd, 1st, 3rd for visual podium effect */}
                {[top3[1], top3[0], top3[2]].filter(u => !!u).map((u) => (
                  <div className={`podium-card rank-${u.rank} ${u.isCurrentUser ? 'is-me' : ''}`} key={u.rank}>
                    <div className="p-avatar-box">
                      <div className="p-avatar">{getAvatarDisplay(u)}</div>
                      <div className="rank-badge-podium">#{u.rank}</div>
                    </div>
                    <h3>{u.isCurrentUser ? 'You' : u.name}</h3>
                    <p className="p-xp">{u.Lms_xp.toLocaleString()} XP</p>
                    <p className="p-pp" style={{ fontSize: '0.9rem', color: '#eab308', fontWeight: 'bold' }}>✨ {u.Lms_pp.toLocaleString()} PP</p>
                    <div className="p-streak">🔥 {u.Lms_streak} days</div>
                  </div>
                ))}
              </section>
            )}

            {/* --- USER RANK CARD (QUICK VIEW) --- */}
            {currentUserData && (
              <section className="user-rank-status-card">
                <div className="u-rank-info">
                  <div className="u-rank-main">
                    <span className="u-val">{currentUserData.rank}{getOrdinal(currentUserData.rank)}</span>
                    <span className="u-label">Overall Rank</span>
                  </div>
                  <div className="u-rank-main">
                    <span className="u-val">{currentUserData.Lms_xp.toLocaleString()}</span>
                    <span className="u-label">Total XP</span>
                  </div>
                  <div className="u-rank-main">
                    <span className="u-val">{currentUserData.Lms_pp.toLocaleString()}</span>
                    <span className="u-label">Total PP</span>
                  </div>
                  <div className="u-rank-main">
                    <span className="u-val">{currentUserData.Lms_streak} Days</span>
                    <span className="u-label">Streak</span>
                  </div>
                </div>
                {currentUserData.rank > 1 && (
                  <div className="u-rank-progress">
                    {(() => {
                      const above = usersWithFlag.find(u => u.rank === currentUserData.rank - 1);
                      const xpNeeded = above ? above.Lms_xp - currentUserData.Lms_xp : 0;
                      const pct = above ? Math.min(Math.floor((currentUserData.Lms_xp / above.Lms_xp) * 100), 99) : 0;
                      return (
                        <>
                          <p>{xpNeeded.toLocaleString()} XP left to reach <strong>#{currentUserData.rank - 1}</strong> Rank</p>
                          <div className="u-xp-bar-outer">
                            <div className="u-xp-bar-fill" style={{ width: `${pct}%` }}></div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </section>
            )}

            {/* --- FULL RANK LIST --- */}
            <section className="rank-list-section">
              <div className="list-header">
                <span>Rank</span>
                <span>User</span>
                <span>Streak</span>
                <span>PP Points</span>
                <span>XP Points</span>
              </div>
              <div className="list-body">
                {others.map((u) => (
                  <div className={`list-row ${u.isCurrentUser ? 'current' : ''}`} key={u.rank}>
                    <div className="r-rank">{u.rank}</div>
                    <div className="r-user">
                      <div className="r-avatar">{getAvatarDisplay(u)}</div>
                      <span>{u.isCurrentUser ? `You (${u.name})` : u.name}</span>
                    </div>
                    <div className="r-streak">🔥 {u.Lms_streak}d</div>
                    <div className="r-pp" style={{ color: '#eab308', fontWeight: 'bold' }}>{u.Lms_pp.toLocaleString()}</div>
                    <div className="r-xp">{u.Lms_xp.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

function getOrdinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

export default Leaderboard;

import React, { useState } from "react";
import "./AdminPanel.css";

const StatsCard = ({ title, value, change, icon, trend }) => (
  <div className="stats-card">
    <div className="stats-info">
      <span className="stats-title">{title}</span>
      <h3 className="stats-value">{value}</h3>
      <span className={`stats-change ${trend}`}>{change}</span>
    </div>
    <div className="stats-icon">{icon}</div>
  </div>
);

const AdminPanel = ({ onLogout }) => {
  const [currentTab, setCurrentTab] = useState("Dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const mockUsers = [
    {
      id: 1,
      name: "Aniket Gupta",
      email: "aniket@company.com",
      role: "Learner",
      status: "Active",
    },
    {
      id: 2,
      name: "Maya Sharma",
      email: "maya@admin.com",
      role: "Admin",
      status: "Verified",
    },
    {
      id: 3,
      name: "Ryan Scott",
      email: "ryan@company.com",
      role: "Learner",
      status: "Inactive",
    },
  ];

  const mockCourses = [
    {
      id: 101,
      title: "Company Onboarding",
      lead: "Team HR",
      status: "Live",
      category: "Compliance",
    },
    {
      id: 102,
      title: "Advanced Java Internal Tooling",
      lead: "Dev Team Lead",
      status: "Review",
      category: "Engineering",
    },
  ];

  return (
    <div className="admin-panel">
      {/* --- SIDEBAR --- */}
      <aside className={`admin-sidebar ${isSidebarOpen ? "" : "collapsed"}`}>
        <div className="sidebar-brand">
          <span className="brand-logo"> Super Admin 🛠️</span>
          <button
            className="toggle-sidebar"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            ☰
          </button>
        </div>
        <nav className="sidebar-nav">
          {[
            "Dashboard",
            "Learners",
            "Admins",
            "Trainings",
            "Analytics",
            "Settings",
          ].map((tab) => (
            <button
              key={tab}
              className={`sidebar-link ${currentTab === tab ? "active" : ""}`}
              onClick={() => setCurrentTab(tab)}
            >
              <span className="link-text">{tab}</span>
            </button>
          ))}
        </nav>
        <button className="sidebar-logout" onClick={onLogout}>
          Logout
        </button>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="admin-main">
        <header className="admin-header">
          <div className="header-left">
            <h2>{currentTab}</h2>
          </div>
          <div className="header-right">
            <div className="admin-search-box">
              <input type="text" placeholder="Search team, trainings..." />
            </div>
            <div className="admin-profile-mini">
              <div className="admin-avatar">A</div>
              <span>Platform Manager</span>
            </div>
          </div>
        </header>

        <div className="admin-content-scroll">
          {currentTab === "Dashboard" && (
            <div className="admin-dashboard-view">
              <div className="stats-grid">
                <StatsCard
                  title="Total Learners"
                  value="1,520"
                  icon="👥"
                  trend="up"
                />
                <StatsCard
                  title="Active Today"
                  value="145"
                  icon="⚡"
                  trend="up"
                />
                <StatsCard
                  title="Modules Published"
                  value="86"
                  icon="📚"
                  trend="up"
                />
                <StatsCard
                  title="Avg Completion"
                  value="72%"
                  icon="⏱"
                  trend="up"
                />
              </div>

              <div className="charts-grid">
                <div className="chart-card">
                  <h3>Engagement (Last 30 Days)</h3>
                  <div className="dummy-chart line-chart">
                    <svg width="100%" height="200" viewBox="0 0 500 150">
                      <polyline
                        fill="none"
                        stroke="#fb923c"
                        strokeWidth="4"
                        points="0,150 50,130 100,140 150,100 200,110 250,60 300,70 350,30 400,40 500,10"
                      />
                    </svg>
                  </div>
                </div>
                <div className="chart-card">
                  <h3>Module Distribution</h3>
                  <div className="dummy-chart bar-chart">
                    {[60, 80, 45, 90, 70, 100].map((h, i) => (
                      <div
                        key={i}
                        className="chart-bar"
                        style={{ height: `${h}%` }}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentTab === "Learners" && (
            <div className="admin-table-view">
              <div className="table-actions">
                <button className="export-btn">Download Team Report 📄</button>
              </div>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Learner Name</th>
                    <th>Corporate Email</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mockUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="bold-td">{user.name}</td>
                      <td>{user.Lms_email}</td>
                      <td>
                        <span
                          className={`status-badge ${user.status.toLowerCase()}`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td>
                        <button className="action-icon-btn">👁️</button>
                        <button className="action-icon-btn red">🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {currentTab === "Trainings" && (
            <div className="admin-table-view">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Training Title</th>
                    <th>Lead</th>
                    <th>Status</th>
                    <th>Category</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mockCourses.map((course) => (
                    <tr key={course.id}>
                      <td className="bold-td">{course.title}</td>
                      <td>{course.lead}</td>
                      <td>
                        <span
                          className={`status-badge ${course.status.toLowerCase()}`}
                        >
                          {course.status}
                        </span>
                      </td>
                      <td>{course.category}</td>
                      <td>
                        <button className="approve-btn">Edit</button>
                        <button className="reject-btn">Archive</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {currentTab === "Admins" && (
            <div className="admin-table-view">
              <div className="table-actions">
                <button className="export-btn">Invite New Admin ➕</button>
              </div>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Expert Name</th>
                    <th>Permissions</th>
                    <th>Modules Led</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'Dr. James Wilson', role: 'Full Access', count: 12 },
                    { name: 'Sarah Connor', role: 'Lead Educator', count: 8 },
                    { name: 'Michael Scott', role: 'Department Head', count: 22 }
                  ].map((adm, i) => (
                    <tr key={i}>
                      <td className="bold-td">{adm.name}</td>
                      <td><span className="pill-mini">{adm.role}</span></td>
                      <td>{adm.count} Trainings</td>
                      <td>
                        <button className="approve-btn">Manage</button>
                        <button className="reject-btn">Revoke</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;

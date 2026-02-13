import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'H' },
  { path: '/scans', label: 'Security Scans', icon: 'S' },
  { path: '/events', label: 'Events', icon: 'E' },
  { path: '/incidents', label: 'Incidents', icon: 'I' },
  { path: '/ai-analysis', label: 'AI Analysis', icon: 'A' },
  { path: '/analytics', label: 'Analytics', icon: 'G' },
  { path: '/compliance', label: 'Compliance', icon: 'C' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="app-layout">
      <nav className="top-nav">
        <div className="nav-left">
          <button className="menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>&#9776;</button>
          <Link to="/dashboard" className="brand">AICyber Platform</Link>
        </div>
        <div className="nav-right">
          <span className="user-info">{user?.name} ({user?.role})</span>
          <button className="logout-btn" onClick={logout}>Logout</button>
        </div>
      </nav>
      <div className="app-body">
        <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="sidebar-icon">{item.icon}</span>
              {sidebarOpen && <span className="sidebar-label">{item.label}</span>}
            </Link>
          ))}
        </aside>
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

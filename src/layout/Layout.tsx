import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import './Layout.css';

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="builder-layout">
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          {!collapsed && <h2>Onboarding Builder</h2>}
          <button className="toggle-btn" onClick={() => setCollapsed(!collapsed)}>
            <span className="material-icons">{collapsed ? 'chevron_right' : 'chevron_left'}</span>
          </button>
        </div>
        {!collapsed && (
          <nav className="sidebar-nav">
            <NavLink to="/builder" end className={({ isActive }) => isActive ? 'active' : ''}>
              <span className="material-icons">add_circle</span>
              <span>New Schema</span>
            </NavLink>
            <NavLink to="/schemas" className={({ isActive }) => isActive ? 'active' : ''}>
              <span className="material-icons">list</span>
              <span>All Schemas</span>
            </NavLink>
          </nav>
        )}
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

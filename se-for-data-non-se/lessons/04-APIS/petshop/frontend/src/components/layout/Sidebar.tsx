import { NavLink } from 'react-router-dom';
import { 
  Home, 
  PawPrint, 
  Search, 
  Box, 
  Code,
  Database
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', icon: <Home size={20} />, label: 'Dashboard', end: true },
  { to: '/pets', icon: <PawPrint size={20} />, label: 'Meus Pets' },
  { to: '/explorer', icon: <Search size={20} />, label: 'API Explorer' },
  { to: '/database', icon: <Database size={20} />, label: 'Database' },
  { to: '/architecture', icon: <Box size={20} />, label: 'Arquitetura' },
  { to: '/codelab', icon: <Code size={20} />, label: 'Code Lab' },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <NavLink to="/" className="sidebar-logo">
          <span className="sidebar-logo-icon">🐾</span>
          <span className="sidebar-logo-text">Pet Shop API</span>
        </NavLink>
      </div>
      
      <nav className="sidebar-nav">
        <div className="sidebar-section">
          <div className="sidebar-section-title">Menu</div>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => 
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
        
        <div className="sidebar-section">
          <div className="sidebar-section-title">
            <Code size={14} style={{ display: 'inline', marginRight: '0.5rem' }} />
            Code Pillars
          </div>
          {[
            { to: '/code/models', label: 'Models', icon: '📋' },
            { to: '/code/crud', label: 'CRUD', icon: '🔄' },
            { to: '/code/actions', label: 'Actions', icon: '⚡' },
            { to: '/code/cache', label: 'Cache', icon: '🔴' },
          ].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => 
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <span className="sidebar-link-icon" style={{ fontSize: '0.875rem' }}>{item.icon}</span>
              <span style={{ fontSize: '0.875rem' }}>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </aside>
  );
}

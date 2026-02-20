import {
  BookOpenText,
  Boxes,
  ChefHat,
  Code2,
  Database,
  Home,
  Layers,
  MenuSquare,
  ServerCog,
  Sparkles,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

const SALON_ITEMS = [
  { to: '/codigo/models', label: 'Modelos', icon: Home, end: true },
  { to: '/codigo/crud', label: 'CRUD', icon: MenuSquare },
  { to: '/codigo/acoes', label: 'Acoes', icon: Database },
];

const CUISINE_ITEMS = [
  { to: '/codigo/cache', label: 'Cache', icon: ChefHat },
  { to: '/arquitetura', label: 'Arquitetura', icon: Boxes },
  { to: '/brigada-code', label: 'Brigada', icon: Sparkles },
];

const CODE_ITEMS = [
  { to: '/codigo/models', label: 'Modelos', icon: Layers },
  { to: '/codigo/crud', label: 'CRUD', icon: ServerCog },
  { to: '/codigo/acoes', label: 'Acoes', icon: BookOpenText },
  { to: '/codigo/cache', label: 'Cache', icon: Code2 },
];

export default function Sidebar() {
  const logoUrl = '/images/ui/new_logo.png?v=20260220-1';

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <NavLink to="/" className="sidebar-logo">
          <span className="sidebar-logo-image-wrap">
            <img
              src={logoUrl}
              alt="Le Philot API Cuisine"
              className="sidebar-logo-image"
            />
          </span>
          <span className="sidebar-logo-copy">
            <span className="sidebar-logo-text">Le Philot API Cuisine</span>
            <span className="sidebar-logo-subtitle">Restaurante Educativo</span>
          </span>
        </NavLink>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section">
          <div className="sidebar-section-title">PILARES</div>
          {SALON_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} end={item.end} className="sidebar-link">
                <span className="sidebar-link-icon"><Icon size={17} /></span>
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-title">LAB</div>
          {CUISINE_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} className="sidebar-link">
                <span className="sidebar-link-icon"><Icon size={17} /></span>
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-title">CODIGO</div>
          {CODE_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} className="sidebar-link sidebar-link-sub">
                <span className="sidebar-link-icon"><Icon size={15} /></span>
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}

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
  { to: '/', label: 'Salon', icon: Home, end: true },
  { to: '/carte', label: 'La Carte', icon: MenuSquare },
  { to: '/cellier', label: 'Le Cellier', icon: Database },
];

const CUISINE_ITEMS = [
  { to: '/cuisine', label: 'La Cuisine', icon: ChefHat },
  { to: '/plan', label: 'Le Plan', icon: Boxes },
  { to: '/brigade', label: 'La Brigade', icon: Sparkles },
];

const CODE_ITEMS = [
  { to: '/code/models', label: 'Models', icon: Layers },
  { to: '/code/crud', label: 'CRUD', icon: ServerCog },
  { to: '/code/actions', label: 'Actions', icon: BookOpenText },
  { to: '/code/cache', label: 'Cache', icon: Code2 },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <NavLink to="/" className="sidebar-logo">
          <span className="sidebar-logo-image-wrap">
            <img
              src="/images/ui/sidebar-logo.png"
              alt="Maison Doree"
              className="sidebar-logo-image"
            />
          </span>
          <span className="sidebar-logo-copy">
            <span className="sidebar-logo-text">Maison Doree</span>
            <span className="sidebar-logo-subtitle">Restaurant Educatif</span>
          </span>
        </NavLink>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section">
          <div className="sidebar-section-title">SALON</div>
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
          <div className="sidebar-section-title">CUISINE</div>
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
          <div className="sidebar-section-title">CODE PILLARS</div>
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

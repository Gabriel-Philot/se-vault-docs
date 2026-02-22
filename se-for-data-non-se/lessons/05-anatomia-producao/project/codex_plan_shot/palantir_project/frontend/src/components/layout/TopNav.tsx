import { motion } from "framer-motion";
import { BookOpen, LayoutDashboard, Map, ScrollText } from "lucide-react";
import { NavLink } from "react-router-dom";
import { assets } from "../../lib/assets";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/missoes", label: "Missoes", icon: ScrollText },
  { to: "/biblioteca", label: "Biblioteca", icon: BookOpen },
  { to: "/arquitetura", label: "Arquitetura", icon: Map }
];

export function TopNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-pal-gold/10 bg-pal-bg/80 backdrop-blur">
      <motion.div
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6"
      >
        <NavLink to="/" className="flex items-center gap-3">
          <img
            src={assets.ui.headerLogo}
            alt="Palantir logo"
            className="h-9 w-9 rounded-lg border border-pal-gold/25 object-cover shadow-glow"
          />
          <div>
            <div className="text-sm font-semibold tracking-wide text-pal-gold">Palantir</div>
            <div className="text-[11px] text-pal-muted">Central de Comando</div>
          </div>
        </NavLink>

        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                  isActive ? "bg-pal-gold/15 text-pal-gold" : "text-pal-text/80 hover:bg-pal-panel hover:text-pal-text"
                ].join(" ")
              }
            >
              <item.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </motion.div>
    </header>
  );
}

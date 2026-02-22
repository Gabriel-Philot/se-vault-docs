import { LayoutGroup, motion } from "framer-motion";
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
    <header className="sticky top-0 z-50 px-3 pt-3 md:px-5">
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="mx-auto max-w-7xl"
      >
        <div className="relative overflow-hidden rounded-2xl border border-pal-gold/12 bg-pal-bg/72 shadow-[0_8px_30px_rgba(0,0,0,0.28)] backdrop-blur-md">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-pal-gold/35 to-transparent" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_15%,rgba(232,178,58,0.10),transparent_42%),linear-gradient(to_bottom,rgba(255,255,255,0.02),transparent_40%)]" />

          <div className="relative flex items-center justify-between gap-3 px-4 py-3 md:px-5">
            <NavLink to="/" className="group flex items-center gap-3">
              <img
                src={assets.ui.headerLogo}
                alt="Palantir logo"
                className="h-9 w-9 rounded-lg border border-pal-gold/25 object-cover shadow-[0_0_18px_rgba(232,178,58,0.18)] transition-transform duration-200 group-hover:-translate-y-0.5"
              />
              <div>
                <div className="text-sm font-semibold tracking-wide text-pal-gold">Palantir</div>
                <div className="flex items-center gap-1.5 text-[11px] text-pal-muted">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-300/80 shadow-[0_0_8px_rgba(16,185,129,0.55)]" />
                  <span>Central de Comando</span>
                </div>
              </div>
            </NavLink>

            <LayoutGroup id="top-nav">
              <nav className="flex items-center gap-1 rounded-xl border border-pal-gold/10 bg-black/15 p-1 backdrop-blur-sm">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      [
                        "group relative inline-flex min-h-10 items-center gap-2 rounded-lg px-3 py-2 text-sm transition duration-200",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pal-gold/35 focus-visible:ring-offset-0",
                        isActive ? "text-pal-gold" : "text-pal-text/80 hover:text-pal-text"
                      ].join(" ")
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive ? (
                          <motion.span
                            layoutId="nav-active-pill"
                            className="absolute inset-0 rounded-lg border border-pal-gold/20 bg-gradient-to-b from-pal-gold/14 to-pal-gold/8 shadow-[0_0_22px_rgba(232,178,58,0.12),inset_0_1px_0_rgba(255,255,255,0.04)]"
                            transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.9 }}
                          />
                        ) : null}
                        <span className="relative z-10 flex items-center gap-2 transition-transform duration-200 group-hover:-translate-y-px">
                          <item.icon className={`h-4 w-4 transition ${isActive ? "drop-shadow-[0_0_8px_rgba(232,178,58,0.28)]" : ""}`} />
                          <span className="hidden sm:inline">{item.label}</span>
                        </span>
                      </>
                    )}
                  </NavLink>
                ))}
              </nav>
            </LayoutGroup>
          </div>
        </div>
      </motion.div>
    </header>
  );
}

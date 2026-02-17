import { NavLink } from "react-router";
import { motion } from "motion/react";

const links = [
  { to: "/classes", label: "Classes & Objects", icon: "⬡" },
  { to: "/inheritance", label: "Inheritance", icon: "⬢" },
  { to: "/encapsulation", label: "Encapsulation", icon: "◈" },
  { to: "/polymorphism", label: "Polymorphism", icon: "◇" },
  { to: "/factory", label: "Factory Pattern", icon: "⚙" },
];

export default function Sidebar() {
  return (
    <nav
      style={{
        width: 240,
        minHeight: "100vh",
        background: "var(--bg-secondary)",
        borderRight: "1px solid rgba(232,114,42,0.15)",
        display: "flex",
        flexDirection: "column",
        padding: "1.5rem 0",
      }}
    >
      <div
        style={{
          padding: "0 1.25rem 1.5rem",
          borderBottom: "1px solid rgba(232,114,42,0.1)",
          marginBottom: "1rem",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "1.4rem",
            fontWeight: 700,
            color: "var(--accent-spice)",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          OOP Playground
        </h1>
        <span
          style={{
            fontSize: "0.7rem",
            color: "var(--text-secondary)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Interactive Learning
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            style={{ textDecoration: "none" }}
          >
            {({ isActive }) => (
              <motion.div
                whileHover={{ x: 4 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.7rem 1.25rem",
                  fontSize: "0.85rem",
                  fontWeight: isActive ? 600 : 400,
                  color: isActive
                    ? "var(--accent-spice)"
                    : "var(--text-secondary)",
                  background: isActive
                    ? "rgba(232,114,42,0.08)"
                    : "transparent",
                  borderLeft: isActive
                    ? "3px solid var(--accent-spice)"
                    : "3px solid transparent",
                  transition: "background 0.2s, color 0.2s",
                  cursor: "pointer",
                }}
              >
                <span style={{ fontSize: "1rem" }}>{link.icon}</span>
                {link.label}
              </motion.div>
            )}
          </NavLink>
        ))}
      </div>

      <div style={{ marginTop: "auto", padding: "1rem 1.25rem" }}>
        <span
          style={{
            fontSize: "0.65rem",
            color: "var(--text-secondary)",
            opacity: 0.5,
          }}
        >
          Dune Edition v0.1
        </span>
      </div>
    </nav>
  );
}

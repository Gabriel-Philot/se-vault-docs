import { NavLink } from "react-router-dom";

const links = [
  { to: "/lab", label: "Live Lab", icon: "◎" },
  { to: "/learn", label: "Pattern Guide", icon: "◈" },
];

export default function NavRail() {
  return (
    <aside className="nav-rail">
      <div className="brand-block">
        <h1>DataFlow Lab</h1>
        <p>CDC + Patterns + Learning</p>
      </div>

      <nav className="nav-links">
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} className="nav-link">
            {({ isActive }) => (
              <div className={`nav-link-inner ${isActive ? "active" : ""}`}>
                <span>{link.icon}</span>
                {link.label}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="nav-footer">035-OPP • Teaching Edition</div>
    </aside>
  );
}

import { Link, NavLink, Outlet } from 'react-router-dom';

const LINKS = [
  { to: '/salao', label: 'Salao' },
  { to: '/cardapio', label: 'Cardapio' },
  { to: '/cozinha', label: 'Cozinha' },
  { to: '/api-explorer', label: 'API Explorer' },
  { to: '/adega-sql', label: 'Adega SQL' },
  { to: '/arquitetura', label: 'Arquitetura' },
  { to: '/brigada-code', label: 'Brigada Code' },
  { to: '/codigo/models', label: 'Codigo' },
];

export default function MainShell() {
  const logoUrl = '/images/ui/new_logo.png?v=20260220-1';

  return (
    <div className="min-h-screen bg-[#0f0a08] text-white">
      <header className="sticky top-0 z-40 border-b border-white/15 bg-[#1d120e]/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <img src={logoUrl} alt="Le Philot API Cuisine" className="h-12 w-12 rounded-md object-contain" />
            <div>
              <p className="font-display text-2xl leading-none text-[#f3dfcf]">Le Philot API Cuisine</p>
              <p className="text-xs uppercase tracking-[0.25em] text-[#d0b399]">Restaurante Educativo</p>
            </div>
          </Link>
          <nav className="hidden gap-2 md:flex">
            {LINKS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm transition ${isActive ? 'bg-[#8f1f2e] text-white' : 'text-[#e8d7c6] hover:bg-white/10'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}

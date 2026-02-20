import { Code2 } from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router-dom';

const CODE_LINKS = [
  { to: '/codigo/models', label: 'Modelos' },
  { to: '/codigo/crud', label: 'CRUD' },
  { to: '/codigo/acoes', label: 'Acoes' },
  { to: '/codigo/cache', label: 'Cache' },
];

export default function CodeTopNav() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/10 bg-[#14100d] p-3 text-[#f3dfcf]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Code2 size={18} />
            <p className="font-display text-2xl leading-none">Pilares de Codigo</p>
          </div>
          <Link to="/" className="rounded-md border border-white/20 px-3 py-2 text-xs uppercase tracking-[0.14em] hover:bg-white/10">
            Voltar ao menu
          </Link>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {CODE_LINKS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-sm ${isActive ? 'bg-[#8f1f2e] text-white' : 'bg-white/10 text-[#ecd9c7] hover:bg-white/20'}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>
      <Outlet />
    </div>
  );
}

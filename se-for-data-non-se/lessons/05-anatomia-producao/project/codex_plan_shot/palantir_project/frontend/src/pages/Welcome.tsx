import { Link } from "react-router-dom";
import { assets } from "../lib/assets";

export function WelcomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-pal-bg via-[#201c17] to-[#141210]">
      <img src={assets.ui.welcomeBg} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover opacity-30" />
      <div className="absolute inset-0 bg-black/45" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(201,168,76,0.18),transparent_40%),radial-gradient(circle_at_80%_30%,rgba(91,143,185,0.14),transparent_40%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-4 py-16 text-center">
        <img
          src={assets.ui.palantirOrb}
          alt="Palantir orb"
          className="mb-8 h-28 w-28 rounded-full border border-pal-gold/30 object-cover shadow-glow md:h-36 md:w-36"
        />
        <p className="mb-2 text-xs uppercase tracking-[0.3em] text-pal-gold/80">Middle-earth Operations</p>
        <h1 className="mb-3 text-5xl font-semibold tracking-tight text-pal-gold md:text-7xl">Palantir</h1>
        <p className="mb-8 max-w-2xl text-sm text-pal-text/85 md:text-lg">
          Central de Comando da Terra-Media para visualizar gateway, workers, cache, filas e arquitetura em producao.
        </p>
        <div className="grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
          <Link className="rounded-xl border border-pal-gold/20 bg-pal-panel/80 px-4 py-4 text-left hover:bg-pal-panel" to="/dashboard">Mapa da Terra-Media</Link>
          <Link className="rounded-xl border border-pal-green/20 bg-pal-panel/80 px-4 py-4 text-left hover:bg-pal-panel" to="/missoes">Missoes</Link>
          <Link className="rounded-xl border border-pal-blue/20 bg-pal-panel/80 px-4 py-4 text-left hover:bg-pal-panel" to="/biblioteca">Biblioteca</Link>
          <Link className="rounded-xl border border-pal-gold/20 bg-pal-panel/80 px-4 py-4 text-left hover:bg-pal-panel" to="/arquitetura">Arquitetura</Link>
        </div>
        <div className="mt-8 grid w-full max-w-3xl grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ["Servicos", "7"],
            ["Workers", "4"],
            ["Cache", "0%"],
            ["Fila", "0"]
          ].map(([label, value]) => (
            <div key={label} className="glass-panel rounded-xl p-3">
              <div className="text-xl font-semibold text-pal-gold">{value}</div>
              <div className="text-xs uppercase tracking-wider text-pal-muted">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

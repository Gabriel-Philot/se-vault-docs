import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function Welcome() {
  const bgUrl = "/images/ui/welcome-bg.jpg?v=20260220-2";
  const logoUrl = "/images/ui/new_logo.png?v=20260220-1";
  return (
    <div
      className="relative min-h-[calc(100vh-8rem)] overflow-hidden rounded-2xl border border-white/10 bg-cover bg-center"
      style={{ backgroundImage: `url('${bgUrl}')` }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/35 to-black/70" />
      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-6 py-20 text-center">
        <motion.img
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          src={logoUrl}
          alt="Le Philot API Cuisine"
          className="mb-7 h-56 w-56 rounded-xl border border-white/25 bg-black/[0.18] object-contain p-2"
        />
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.55, delay: 0.15 }}
          className="font-display text-5xl text-[#f4e4d3] sm:text-6xl"
        >
          Le Philot API Cuisine
        </motion.h1>
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.4 }}
          className="mt-10 w-full max-w-3xl rounded-2xl border border-white/20 bg-black/[0.34] px-6 py-6 backdrop-blur-md"
        >
          <p className="mx-auto max-w-2xl text-lg text-[#f3dfcf]">
            Do salao a cozinha, acompanhe cada pedido com fluidez, controle operacional e observabilidade de API em tempo real.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link className="rounded-lg bg-[#8f1f2e] px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#a22839]" to="/salao">
              Entrar no Salao
            </Link>
            <Link className="rounded-lg border border-[#d7b28f]/40 bg-black/20 px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#f5e6d7] transition hover:bg-black/35" to="/cardapio">
              Abrir Cardapio
            </Link>
            <Link className="rounded-lg border border-[#d7b28f]/40 bg-black/20 px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#f5e6d7] transition hover:bg-black/35" to="/api-explorer">
              Ver APIs
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

import { motion, useReducedMotion } from "framer-motion";
import { BookOpen, LayoutDashboard, Map, ScrollText } from "lucide-react";
import { Link } from "react-router-dom";
import { assets } from "../lib/assets";

const landingLinks = [
  { to: "/dashboard", label: "Mapa da Terra-Media", sub: "Fluxo vivo", tone: "gold", icon: LayoutDashboard },
  { to: "/missoes", label: "Missoes", sub: "Heroes + terminal", tone: "green", icon: ScrollText },
  { to: "/biblioteca", label: "Biblioteca", sub: "Cache + SQL", tone: "blue", icon: BookOpen },
  { to: "/arquitetura", label: "Arquitetura", sub: "Trace replay", tone: "gold", icon: Map }
] as const;

function toneClasses(tone: (typeof landingLinks)[number]["tone"]) {
  switch (tone) {
    case "green":
      return "border-pal-green/20 hover:border-pal-green/35";
    case "blue":
      return "border-pal-blue/20 hover:border-pal-blue/35";
    case "gold":
    default:
      return "border-pal-gold/20 hover:border-pal-gold/35";
  }
}

export function WelcomePage() {
  const reducedMotion = useReducedMotion();
  const rise = reducedMotion ? { initial: false, animate: { opacity: 1 } } : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 } };
  const eyebrow = "MIDDLE-EARTH OPERATIONS";
  const stats = [
    { label: "Servicos", value: "7", tone: "text-pal-gold" },
    { label: "Workers", value: "4", tone: "text-pal-blue" },
    { label: "Cache", value: "0%", tone: "text-pal-green" },
    { label: "Fila", value: "0", tone: "text-red-400" }
  ] as const;

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-pal-bg via-[#201c17] to-[#141210]">
      <img src={assets.ui.welcomeBg} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover opacity-30" />
      <div className="absolute inset-0 bg-black/45" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(201,168,76,0.18),transparent_40%),radial-gradient(circle_at_80%_30%,rgba(91,143,185,0.14),transparent_40%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-8 md:px-6 md:py-10">
        <div className="relative flex flex-1 flex-col items-center justify-center py-8 text-center">
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.36, ease: "easeOut" }}
            className="relative mb-8"
          >
            <div className="absolute inset-[-20px] rounded-full bg-pal-gold/12 blur-2xl" />
            <div className="relative h-24 w-24 md:h-32 md:w-32">
              <img
                src={assets.ui.palantirOrb}
                alt="Palantir orb"
                className="absolute inset-0 h-full w-full rounded-full object-cover shadow-[0_0_28px_rgba(232,178,58,0.22)]"
              />
              <div className="pointer-events-none absolute inset-[1px] rounded-full bg-white/[0.015] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]" />
              {!reducedMotion && (
                <>
                  <motion.div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-[7%] rounded-full opacity-55 mix-blend-screen"
                    animate={{
                      backgroundPosition: ["18% 22%, 78% 76%", "26% 16%, 70% 82%", "18% 22%, 78% 76%"]
                    }}
                    transition={{ duration: 8.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                    style={{
                      backgroundImage:
                        "radial-gradient(circle at 18% 22%, rgba(255,255,255,0.25), transparent 38%), radial-gradient(circle at 78% 76%, rgba(255,255,255,0.10), transparent 42%)",
                      backgroundSize: "100% 100%, 100% 100%"
                    }}
                  />
                  <motion.div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-[10%] rounded-full"
                    animate={{ rotate: [0, 9, -6, 0], scale: [1, 1.015, 0.995, 1] }}
                    transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                    style={{
                      background:
                        "radial-gradient(circle at 32% 26%, rgba(255,255,255,0.16), transparent 36%), linear-gradient(145deg, rgba(255,255,255,0.05), transparent 52%)"
                    }}
                  />
                </>
              )}
              {reducedMotion && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-[10%] rounded-full bg-[radial-gradient(circle_at_28%_24%,rgba(255,255,255,0.16),transparent_36%),linear-gradient(145deg,rgba(255,255,255,0.05),transparent_52%)]"
                />
              )}
              <div className="pointer-events-none absolute left-[22%] top-[15%] h-[18%] w-[36%] rounded-full bg-white/10 blur-[2px]" />
              <div className="pointer-events-none absolute inset-0 rounded-full [mask-image:radial-gradient(circle,black_60%,transparent_100%)] bg-[radial-gradient(circle_at_55%_58%,transparent_32%,rgba(255,255,255,0.04)_58%,transparent_78%)]" />
            </div>
          </motion.div>

          <div className="mb-2 flex flex-wrap justify-center gap-x-[0.02em] gap-y-0 text-xs uppercase tracking-[0.28em] text-pal-gold/85">
            {eyebrow.split("").map((char, idx) => (
              <motion.span
                key={`${char}-${idx}`}
                initial={reducedMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.16, ease: "easeOut", delay: reducedMotion ? 0 : 0.02 * idx }}
                className={char === " " ? "mx-[0.06em]" : ""}
              >
                {char}
              </motion.span>
            ))}
          </div>

          <motion.h1
            {...rise}
            transition={{ duration: 0.28, ease: "easeOut", delay: reducedMotion ? 0 : 0.04 }}
            className="relative mb-3 pb-3 text-5xl font-semibold tracking-tight md:pb-4 md:text-7xl"
          >
            <span className="relative z-10 text-pal-gold/90 drop-shadow-[0_2px_14px_rgba(0,0,0,0.55)]">Palantir</span>
            <motion.span
              aria-hidden="true"
              initial={reducedMotion ? false : { opacity: 0.85, backgroundPosition: "0% 50%" }}
              animate={
                reducedMotion
                  ? { opacity: 0.7 }
                  : {
                      opacity: [0.72, 0.95, 0.78],
                      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
                    }
              }
              transition={
                reducedMotion
                  ? { duration: 0.2 }
                  : { duration: 7.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }
              }
              className="pointer-events-none absolute inset-0 z-20 text-transparent bg-[linear-gradient(105deg,#c69a32_0%,#f8d77a_22%,#fff1b8_38%,#d49a2b_56%,#f0ca69_76%,#c78e22_100%)] bg-[length:220%_220%] bg-clip-text drop-shadow-[0_0_22px_rgba(232,178,58,0.18)]"
            >
              Palantir
            </motion.span>
            {!reducedMotion && (
              <motion.span
                aria-hidden="true"
                initial={{ opacity: 0, backgroundPosition: "180% 0%" }}
                animate={{ opacity: [0, 0.7, 0, 0, 0], backgroundPosition: ["180% 0%", "10% 0%", "-140% 0%", "-140% 0%", "-140% 0%"] }}
                transition={{ duration: 6.2, ease: "easeOut", repeat: Number.POSITIVE_INFINITY, repeatDelay: 1.4, delay: 0.45 }}
                className="pointer-events-none absolute inset-0 z-30 text-transparent bg-[linear-gradient(112deg,transparent_28%,rgba(255,248,224,0.95)_49%,rgba(255,232,163,0.45)_54%,transparent_72%)] bg-clip-text bg-[length:220%_100%]"
              >
                Palantir
              </motion.span>
            )}
            <span className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto h-[2px] w-[72%] rounded-full bg-gradient-to-r from-transparent via-pal-gold/45 to-transparent blur-[0.2px]" />
          </motion.h1>

          <motion.p
            {...rise}
            transition={{ duration: 0.28, ease: "easeOut", delay: reducedMotion ? 0 : 0.08 }}
            className="mb-8 max-w-2xl text-sm text-pal-text/88 drop-shadow-[0_1px_8px_rgba(0,0,0,0.45)] md:text-lg"
          >
            Central de Comando da Terra-Media para visualizar gateway, workers, cache, filas e arquitetura em producao.
          </motion.p>

          <motion.div
            {...rise}
            transition={{ duration: 0.28, ease: "easeOut", delay: reducedMotion ? 0 : 0.12 }}
            className="grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2"
          >
            {landingLinks.map((item) => (
              <Link
                key={item.to}
                className={`group relative overflow-hidden rounded-xl border bg-black/28 px-4 py-4 text-left backdrop-blur-md transition duration-200 hover:-translate-y-0.5 hover:bg-black/34 ${toneClasses(item.tone)}`}
                to={item.to}
              >
                <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-200 group-hover:opacity-100 bg-[radial-gradient(circle_at_14%_25%,rgba(232,178,58,0.12),transparent_45%)]" />
                <div className="relative flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-pal-text">{item.label}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.14em] text-pal-text/60">{item.sub}</div>
                  </div>
                  <span className="rounded-lg border border-pal-gold/12 bg-black/25 p-2">
                    <item.icon className="h-4 w-4 text-pal-gold/80 transition duration-200 group-hover:text-pal-gold group-hover:-translate-y-px" />
                  </span>
                </div>
              </Link>
            ))}
          </motion.div>

          <motion.div
            {...rise}
            transition={{ duration: 0.26, ease: "easeOut", delay: reducedMotion ? 0 : 0.16 }}
            className="mt-8 flex w-full max-w-3xl flex-wrap items-center justify-center gap-x-5 gap-y-3 rounded-2xl border border-pal-gold/10 bg-black/20 px-4 py-3 backdrop-blur-md"
          >
            {stats.map((item, idx) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className="text-right">
                  <div className={`text-2xl font-semibold leading-none drop-shadow-[0_0_10px_rgba(0,0,0,0.35)] ${item.tone}`}>{item.value}</div>
                  <div className="mt-1 text-[10px] uppercase tracking-[0.22em] text-pal-text/70">{item.label}</div>
                </div>
                {idx < stats.length - 1 ? <div aria-hidden="true" className="h-8 w-px bg-gradient-to-b from-transparent via-pal-gold/20 to-transparent" /> : null}
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

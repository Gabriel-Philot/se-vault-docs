import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, ArrowDown, ArrowUp, Database, Globe, Shield } from "lucide-react";
import { cn } from "../../lib/utils";

export const DIPSection = () => {
  const [isInverted, setIsInverted] = useState(false);
  const [showEtl, setShowEtl] = useState(false);

  return (
    <section id="dip" className="min-h-screen py-24 px-6 bg-dip/5 relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-dip/10 border border-dip/20">
              <Zap className="w-4 h-4 text-dip" />
              <span className="text-xs font-bold text-dip uppercase tracking-wider">Dependency Inversion Principle</span>
            </div>
            <h2 className="text-5xl font-bold font-display leading-tight">
              Dependency <span className="text-dip">Inversion</span>
            </h2>
            <p className="text-white/40 text-sm font-mono -mt-2">Inversão de Dependência</p>
            <p className="text-white/60 text-lg">
              Módulos de alto nível não devem depender de módulos de baixo nível. Ambos devem depender de abstrações.
            </p>
            <div className="space-y-4 pt-8">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-dip/20 flex items-center justify-center shrink-0">
                  <span className="text-dip font-bold">1</span>
                </div>
                <p className="text-sm text-white/80">
                  Atualmente, <span className="text-dip font-bold">Pipeline</span> recebe <span className="text-dip font-bold">MySQLSource</span> diretamente no construtor — acoplamento concreto.
                </p>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-dip/20 flex items-center justify-center shrink-0">
                  <span className="text-dip font-bold">2</span>
                </div>
                <p className="text-sm text-white/80">
                  Clique em "Inverter" para injetar <span className="text-dip font-bold">Source (ABC)</span> pelo construtor — o Pipeline passa a depender da abstração.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsInverted(!isInverted)}
              className="mt-8 px-8 py-4 rounded-full bg-dip text-white font-bold font-display hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(244,63,94,0.4)]"
            >
              {isInverted ? "Resetar Dependência" : "Inverter Dependência"}
            </button>

            <div className="space-y-2">
              <button
                onClick={() => setShowEtl(!showEtl)}
                className="text-xs text-white/40 hover:text-white/70 transition-colors flex items-center gap-1"
              >
                <span>{showEtl ? '▼' : '▶'}</span> Ver injeção de dependência (ETL)
              </button>
              {showEtl && (
                <div className="glass rounded-xl p-4 border-dip/10 code-block text-xs">
                  <div className="text-white/40"># Antes: acoplamento concreto</div>
                  <div className="text-blue-400">class <span className="text-yellow-400">Pipeline</span>:</div>
                  <div className="pl-4 text-white/60">def __init__(self):</div>
                  <div className="pl-8 text-white/60">self.source = MySQLSource()  <span className="text-red-400/60"># ❌</span></div>
                  <div className="mt-3 text-white/40"># Depois: injeção pelo construtor</div>
                  <div className="text-blue-400">class <span className="text-yellow-400">Pipeline</span>:</div>
                  <div className="pl-4 text-white/60">def __init__(self, source: <span className="text-purple-400">Source</span>,</div>
                  <div className="pl-20 text-white/60">transforms: list[<span className="text-purple-400">Transformable</span>]):</div>
                  <div className="pl-8 text-white/60">self.source = source  <span className="text-green-400/60"># ✓</span></div>
                </div>
              )}
            </div>
          </div>

          <div className="relative h-[600px] flex flex-col items-center justify-center">
            {/* High Level Module */}
            <ModuleCard
              icon={<Globe className="w-6 h-6" />}
              title="Módulo de Alto Nível"
              subtitle="Pipeline (ETL Logic)"
              color="bg-dip"
            />

            {/* Arrows Container */}
            <div className="h-48 w-full relative flex flex-col items-center justify-center">
              <motion.div
                animate={{
                  rotate: isInverted ? 180 : 0,
                  opacity: isInverted ? 0 : 1,
                  y: isInverted ? 20 : 0
                }}
                className="flex flex-col items-center gap-2"
              >
                <div className="w-1 h-12 bg-white/20 rounded-full" />
                <ArrowDown className="w-6 h-6 text-white/40" />
              </motion.div>

              <AnimatePresence>
                {isInverted && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute inset-0 flex flex-col items-center justify-center"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <ArrowUp className="w-6 h-6 text-dip" />
                      <div className="w-1 h-8 bg-dip/40 rounded-full" />
                    </div>

                    <div className="glass px-6 py-3 rounded-xl border-dip/50 bg-dip/10 my-2">
                      <span className="font-mono text-xs text-dip font-bold">Source (ABC)</span>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                      <div className="w-1 h-8 bg-dip/40 rounded-full" />
                      <ArrowUp className="w-6 h-6 text-dip" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Low Level Module */}
            <ModuleCard
              icon={<Database className="w-6 h-6" />}
              title="Módulo de Baixo Nível"
              subtitle="Infraestrutura (MySQLSource)"
              color="bg-white/10"
              borderColor={isInverted ? "border-dip/30" : "border-white/5"}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

const ModuleCard = ({ icon, title, subtitle, color, borderColor = "border-white/5" }: any) => (
  <div className={cn(
    "w-64 p-6 rounded-2xl border-2 flex flex-col items-center text-center transition-all",
    color,
    borderColor
  )}>
    <div className="w-12 h-12 rounded-xl bg-black/20 flex items-center justify-center mb-4">
      {icon}
    </div>
    <h3 className="font-display font-bold text-sm">{title}</h3>
    <p className="text-[10px] uppercase tracking-widest text-white/40 mt-1">{subtitle}</p>
  </div>
);

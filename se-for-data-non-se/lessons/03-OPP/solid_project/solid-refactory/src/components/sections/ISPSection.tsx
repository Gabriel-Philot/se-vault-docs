import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Scissors, Zap } from "lucide-react";
import { cn } from "../../lib/utils";

export const ISPSection = () => {
  const [sliderValue, setSliderValue] = useState(0);
  const [showEtl, setShowEtl] = useState(false);

  // 0 = Fat Interface, 100 = Segregated Protocols
  const isSegregated = sliderValue > 70;

  return (
    <section id="isp" className="min-h-screen py-24 px-6 bg-isp/5 relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-isp/10 border border-isp/20">
            <Share2 className="w-4 h-4 text-isp" />
            <span className="text-xs font-bold text-isp uppercase tracking-wider">Interface Segregation Principle</span>
          </div>
          <h2 className="text-5xl font-bold font-display">
            Interface <span className="text-isp">Segregation</span>
          </h2>
          <p className="text-white/40 text-sm font-mono -mt-2">Segregação de Interface</p>
          <p className="text-white/60 max-w-2xl mx-auto">
            Clientes não devem ser forçados a depender de métodos que não usam. Divida interfaces gordas em interfaces menores e mais específicas.
          </p>
        </div>

        <div className="flex flex-col items-center gap-12">
          {/* The Slider */}
          <div className="w-full max-w-md space-y-4">
            <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold text-white/40">
              <span>Interface Gorda</span>
              <span>Segregada</span>
            </div>
            <div className="relative h-12 flex items-center">
              <input
                type="range"
                min="0"
                max="100"
                value={sliderValue}
                onChange={(e) => setSliderValue(parseInt(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-isp"
              />
              <div
                style={{ left: `calc(${sliderValue}% * (100% - 40px) / 100% + 20px)` }}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none transition-all duration-75"
              >
                <div className="w-10 h-10 rounded-full bg-isp shadow-[0_0_20px_rgba(16,185,129,0.5)] flex items-center justify-center">
                  <Scissors className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* ETL Collapsible */}
          <div className="space-y-2 w-full max-w-md">
            <button
              onClick={() => setShowEtl(!showEtl)}
              className="text-xs text-white/40 hover:text-white/70 transition-colors flex items-center gap-1"
            >
              <span>{showEtl ? '▼' : '▶'}</span> Exemplo Python (Protocols)
            </button>
            {showEtl && (
              <div className="glass rounded-xl p-4 border-isp/10 code-block text-xs">
                <div className="text-purple-400">from typing import <span className="text-yellow-400">Protocol</span></div>
                <div className="mt-2 text-blue-400">class <span className="text-yellow-400">Readable</span>(<span className="text-purple-400">Protocol</span>):</div>
                <div className="pl-4 text-white/60">def read(self, source: str) -&gt; list: ...</div>
                <div className="mt-1 text-blue-400">class <span className="text-yellow-400">Transformable</span>(<span className="text-purple-400">Protocol</span>):</div>
                <div className="pl-4 text-white/60">def transform(self, row: dict) -&gt; dict: ...</div>
                <div className="mt-1 text-blue-400">class <span className="text-yellow-400">Loadable</span>(<span className="text-purple-400">Protocol</span>):</div>
                <div className="pl-4 text-white/60">def load(self, dest: str, data: list) -&gt; None: ...</div>
              </div>
            )}
          </div>

          {/* The Code Morphing */}
          <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="wait">
              {!isSegregated ? (
                <motion.div
                  key="fat"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="lg:col-start-2 glass p-8 rounded-3xl border-isp/20 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Zap className="w-24 h-24 text-isp" />
                  </div>
                  <h3 className="font-display font-bold text-xl mb-4 flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-isp" />
                    Interface Gorda
                  </h3>
                  <div className="code-block bg-black/40 min-h-[250px]">
                    <div className="text-blue-400">class <span className="text-yellow-400">IDataProcessor</span>:</div>
                    <div className="pl-4 text-white/60 mt-2">def read(self, source): ...</div>
                    <div className="pl-4 text-white/60">def transform(self, row): ...</div>
                    <div className="pl-4 text-white/60">def load(self, dest): ...</div>
                    <div className="pl-4 text-white/60">def validate(self, row): ...</div>
                  </div>
                  <div className="mt-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 text-center">
                    Obriga sources read-only a implementar load!
                  </div>
                </motion.div>
              ) : (
                <>
                  <ProtocolCard
                    title="Readable"
                    methods={["read(self, source)"]}
                    delay={0}
                  />
                  <ProtocolCard
                    title="Transformable"
                    methods={["transform(self, row)"]}
                    delay={0.1}
                  />
                  <ProtocolCard
                    title="Loadable"
                    methods={["load(self, dest)"]}
                    delay={0.2}
                  />
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};

const ProtocolCard = ({ title, methods, delay }: { title: string; methods: string[]; delay: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="glass p-6 rounded-2xl border-isp/40 bg-isp/5"
  >
    <h3 className="font-display font-bold text-lg mb-3 text-isp">{title}</h3>
    <div className="code-block bg-black/40">
      <div className="text-blue-400">class <span className="text-yellow-400">{title}</span>(<span className="text-purple-400">Protocol</span>):</div>
      {methods.map((m, i) => (
        <div key={i} className="pl-4 text-white/60 mt-1">def {m}: ...</div>
      ))}
    </div>
  </motion.div>
);

import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Trophy, ArrowRight } from "lucide-react";
import { SpotlightCard } from "../ui/spotlight-card";

const PRINCIPLES = [
  { name: "Responsabilidade Única", score: 100, color: "bg-srp", spotlight: "rgba(249, 115, 22, 0.1)" },
  { name: "Aberto/Fechado", score: 100, color: "bg-ocp", spotlight: "rgba(139, 92, 246, 0.1)" },
  { name: "Substituição de Liskov", score: 100, color: "bg-lsp", spotlight: "rgba(6, 182, 212, 0.1)" },
  { name: "Segregação de Interface", score: 100, color: "bg-isp", spotlight: "rgba(16, 185, 129, 0.1)" },
  { name: "Inversão de Dependência", score: 100, color: "bg-dip", spotlight: "rgba(244, 63, 94, 0.1)" },
];

export const RecapSection = () => {
  return (
    <section className="min-h-screen py-24 px-6 bg-background relative">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-20">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yellow-500/10 border border-yellow-500/20 mb-6"
          >
            <Trophy className="w-10 h-10 text-yellow-500" />
          </motion.div>
          <h2 className="text-6xl font-bold font-display mb-4">Refactory Completo</h2>
          <p className="text-white/40 text-xl">Você dominou as bases de uma arquitetura limpa.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-20">
          {PRINCIPLES.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
            >
              <SpotlightCard
                spotlightColor={p.spotlight}
                className="p-6 rounded-2xl flex flex-col items-center text-center h-full border-white/5"
              >
                <div className="relative w-16 h-16 mb-4">
                  <svg className="w-full h-full" viewBox="0 0 36 36">
                    <path
                      className="text-white/5"
                      strokeDasharray="100, 100"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    />
                    <motion.path
                      initial={{ strokeDasharray: "0, 100" }}
                      whileInView={{ strokeDasharray: `${p.score}, 100` }}
                      transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                      className={p.color.replace('bg-', 'text-')}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <CheckCircle2 className={`w-6 h-6 ${p.color.replace('bg-', 'text-')}`} />
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/60 leading-tight">
                  {p.name}
                </span>
              </SpotlightCard>
            </motion.div>
          ))}
        </div>

        <div className="glass rounded-3xl overflow-hidden border-white/5">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5">
                <th className="p-6 text-xs font-bold uppercase tracking-widest text-white/40">Princípio</th>
                <th className="p-6 text-xs font-bold uppercase tracking-widest text-white/40">Resumo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {PRINCIPLES.map((p) => (
                <tr key={p.name} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${p.color}`} />
                      <span className="font-display font-bold">{p.name}</span>
                    </div>
                  </td>
                  <td className="p-6 text-white/60 text-sm">
                    {p.name === "Responsabilidade Única" && "Um motivo para mudar."}
                    {p.name === "Aberto/Fechado" && "Estenda o comportamento sem editar o código fonte."}
                    {p.name === "Substituição de Liskov" && "Subtipos devem ser intercambiáveis."}
                    {p.name === "Segregação de Interface" && "Sem dependências forçadas em métodos não usados."}
                    {p.name === "Inversão de Dependência" && "Dependa de abstrações, não de implementações concretas."}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Conexão com Dados */}
        <div className="mt-12 glass rounded-3xl overflow-hidden border-white/5">
          <div className="p-6 bg-white/5 border-b border-white/5">
            <h3 className="font-display font-bold text-lg">Conexão com Dados</h3>
            <p className="text-xs text-white/40 mt-1">Como cada princípio se aplica em pipelines de dados</p>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5">
                <th className="p-6 text-xs font-bold uppercase tracking-widest text-white/40">Princípio</th>
                <th className="p-6 text-xs font-bold uppercase tracking-widest text-white/40">Aplicação em dados</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr className="hover:bg-white/[0.02] transition-colors">
                <td className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-srp" />
                    <span className="font-display font-bold text-sm">SRP</span>
                  </div>
                </td>
                <td className="p-6 text-white/60 text-sm">Separar validação, transformação e load em classes distintas</td>
              </tr>
              <tr className="hover:bg-white/[0.02] transition-colors">
                <td className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-ocp" />
                    <span className="font-display font-bold text-sm">OCP</span>
                  </div>
                </td>
                <td className="p-6 text-white/60 text-sm">Novo conector (S3, BigQuery) sem mexer no pipeline existente</td>
              </tr>
              <tr className="hover:bg-white/[0.02] transition-colors">
                <td className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-lsp" />
                    <span className="font-display font-bold text-sm">LSP</span>
                  </div>
                </td>
                <td className="p-6 text-white/60 text-sm">ParquetSource substitui CsvSource em testes sem quebrar o pipeline</td>
              </tr>
              <tr className="hover:bg-white/[0.02] transition-colors">
                <td className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-isp" />
                    <span className="font-display font-bold text-sm">ISP</span>
                  </div>
                </td>
                <td className="p-6 text-white/60 text-sm">Readable, Transformable, Loadable em vez de DataProcessor monolítico</td>
              </tr>
              <tr className="hover:bg-white/[0.02] transition-colors">
                <td className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-dip" />
                    <span className="font-display font-bold text-sm">DIP</span>
                  </div>
                </td>
                <td className="p-6 text-white/60 text-sm">Pipeline recebe Source pelo construtor — troca por config sem refactor</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-20 text-center">
          <button className="group inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-background font-bold font-display hover:scale-105 transition-all">
            Compartilhar Pontuação
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
};

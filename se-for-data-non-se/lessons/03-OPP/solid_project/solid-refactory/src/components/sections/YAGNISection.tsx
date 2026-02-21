import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";

const OVERENGINEERING_SIGNALS = [
  {
    id: "single_impl",
    signal: "Única implementação",
    description: "Se existe só uma implementação concreta e nenhuma no horizonte, uma interface aqui é YAGNI.",
    example: "Criar Source(ABC) quando só existe CsvSource e nenhum outro conector está planejado.",
    isOverengineering: true,
  },
  {
    id: "sla_pipeline",
    signal: "Pipeline com SLA de produção",
    description: "Quando o pipeline já tem SLA, testes, múltiplos conectores e novos adicionados frequentemente — SOLID compensa.",
    example: "Pipeline de dados crítico com CsvSource, ApiSource, S3Source — novos conectores chegam todo sprint.",
    isOverengineering: false,
  },
  {
    id: "script_descartavel",
    signal: "Script descartável",
    description: "Scripts ad-hoc, análises únicas, provas de conceito — SOLID aqui é burocracia desnecessária.",
    example: "Script de migração pontual que roda uma vez e nunca mais é tocado.",
    isOverengineering: true,
  },
];

const HEURISTIC_EXAMPLES = [
  {
    id: "ex1",
    scenario: "Você criou uma abstração com um único implementador concreto",
    overengineering: true,
  },
  {
    id: "ex2",
    scenario: "Você precisa trocar o banco de dados dependendo do ambiente (dev/prod)",
    overengineering: false,
  },
  {
    id: "ex3",
    scenario: "Script de limpeza de dados que roda uma vez por trimestre",
    overengineering: true,
  },
];

export const YAGNISection = () => {
  const [answers, setAnswers] = useState<Record<string, boolean | null>>({
    ex1: null, ex2: null, ex3: null,
  });
  const [feedback, setFeedback] = useState<Record<string, boolean>>({});

  const handleAnswer = (id: string, answer: boolean, correct: boolean) => {
    setAnswers(prev => ({ ...prev, [id]: answer }));
    setFeedback(prev => ({ ...prev, [id]: answer === correct }));
  };

  return (
    <section id="yagni" className="min-h-screen py-24 px-6 relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20">
            <AlertCircle className="w-4 h-4 text-yellow-400" />
            <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider">YAGNI — You Ain't Gonna Need It</span>
          </div>
          <h2 className="text-5xl font-bold font-display">
            Quando <span className="text-yellow-400">NÃO</span> usar SOLID
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            SOLID não é uma religião. Aplicar padrões desnecessariamente é overengineering.
            Reconheça os três sinais de que você está indo longe demais.
          </p>
        </div>

        {/* Signals Table */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {OVERENGINEERING_SIGNALS.map((signal, i) => (
            <motion.div
              key={signal.id}
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className={`glass p-6 rounded-2xl border ${
                signal.isOverengineering
                  ? 'border-red-500/20 bg-red-500/5'
                  : 'border-green-500/20 bg-green-500/5'
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                {signal.isOverengineering
                  ? <XCircle className="w-5 h-5 text-red-400" />
                  : <CheckCircle2 className="w-5 h-5 text-green-400" />}
                <h3 className="font-display font-bold text-sm">{signal.signal}</h3>
              </div>
              <p className="text-xs text-white/60 mb-3">{signal.description}</p>
              <div className="p-3 rounded-lg bg-black/20 text-xs text-white/40 italic">
                "{signal.example}"
              </div>
            </motion.div>
          ))}
        </div>

        {/* Heuristic Quiz */}
        <div className="max-w-2xl mx-auto">
          <h3 className="text-xl font-display font-bold mb-6 text-center text-white/80">
            Overengineering ou não?
          </h3>
          <div className="space-y-4">
            {HEURISTIC_EXAMPLES.map((ex) => (
              <div key={ex.id} className="glass p-5 rounded-2xl border border-white/5">
                <p className="text-sm text-white/80 mb-4">{ex.scenario}</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleAnswer(ex.id, true, ex.overengineering)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                      answers[ex.id] === true
                        ? feedback[ex.id] ? 'bg-green-500/20 border border-green-500/50 text-green-400' : 'bg-red-500/20 border border-red-500/50 text-red-400'
                        : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    Overengineering
                  </button>
                  <button
                    onClick={() => handleAnswer(ex.id, false, ex.overengineering)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                      answers[ex.id] === false
                        ? feedback[ex.id] ? 'bg-green-500/20 border border-green-500/50 text-green-400' : 'bg-red-500/20 border border-red-500/50 text-red-400'
                        : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    Justificado
                  </button>
                </div>
                <AnimatePresence>
                  {answers[ex.id] !== null && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      className="mt-3 text-xs text-white/50 overflow-hidden"
                    >
                      {feedback[ex.id] ? '✓ Correto! ' : '✗ '}{ex.overengineering ? 'Overengineering: SOLID aqui cria mais problema do que resolve.' : 'Justificado: este é exatamente o caso de uso para o qual SOLID foi criado.'}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

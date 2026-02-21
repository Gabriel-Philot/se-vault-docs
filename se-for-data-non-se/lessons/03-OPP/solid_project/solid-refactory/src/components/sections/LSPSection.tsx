import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "../../lib/utils";
import { SpotlightCard } from "../ui/spotlight-card";

interface Subclass {
  id: string;
  name: string;
  code: string;
  isCorrect: boolean;
  description: string;
}

const SUBCLASSES: Subclass[] = [
  {
    id: "broken_source",
    name: "BrokenSource(Source)",
    code: "def read(self, path: str):\n  if not os.path.exists(path):\n    return None  # ← quebra o contrato!",
    isCorrect: false,
    description: "Quebra o LSP! Source.read() deve retornar list. Retornar None força todos os consumidores a checarem None — violação de contrato."
  },
  {
    id: "empty_source",
    name: "EmptySource(Source)",
    code: "def read(self, path: str) -> list:\n  if not os.path.exists(path):\n    return []  # ← lista vazia: contrato mantido",
    isCorrect: true,
    description: "Segue o LSP. Retorna lista vazia quando não há dados — o pipeline continua funcionando sem tratamento especial."
  },
  {
    id: "silent_transformer",
    name: "SilentTransformer(Transformable)",
    code: "def transform(self, row: dict) -> dict:\n  pass  # retorna None implícito",
    isCorrect: false,
    description: "Quebra o LSP! Falha silenciosa: o contrato exige retornar dict, mas pass retorna None. O pipeline vai falhar downstream."
  },
  {
    id: "parquet_source",
    name: "ParquetSource(Source)",
    code: "def read(self, path: str) -> list:\n  return pd.read_parquet(path).to_dict('records')",
    isCorrect: true,
    description: "Segue o LSP. ParquetSource substitui CsvSource em qualquer pipeline sem quebrar nada — mesmo contrato, implementação diferente."
  }
];

export const LSPSection = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [shakeId, setShakeId] = useState<string | null>(null);

  const handleSelect = (subclass: Subclass) => {
    setSelectedId(subclass.id);
    if (!subclass.isCorrect) {
      setShakeId(subclass.id);
      setTimeout(() => setShakeId(null), 500);
    }
  };

  return (
    <section id="lsp" className="min-h-screen py-24 px-6 bg-lsp/5 relative">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12 mb-16">
          <div className="max-w-xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lsp/10 border border-lsp/20">
              <Cpu className="w-4 h-4 text-lsp" />
              <span className="text-xs font-bold text-lsp uppercase tracking-wider">Liskov Substitution Principle</span>
            </div>
            <h2 className="text-5xl font-bold font-display">
              Liskov <span className="text-lsp">Substitution</span>
            </h2>
            <p className="text-white/40 text-sm font-mono -mt-2">Substituição de Liskov</p>
            <p className="text-white/60">
              Subtipos devem ser substituíveis pelos seus tipos base. Se uma subclasse muda o comportamento da classe base de forma inesperada, ela quebra o contrato.
            </p>
          </div>

          <SpotlightCard spotlightColor="rgba(6, 182, 212, 0.2)" className="p-6 rounded-2xl border-lsp/20 max-w-sm">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-lsp" />
              <h3 className="font-display font-bold">Quiz de Contrato</h3>
            </div>
            <p className="text-sm text-white/60">
              Identifique qual implementação <strong>viola o contrato</strong> da classe base. Clique em cada card para ver a explicação.
            </p>
          </SpotlightCard>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SUBCLASSES.map((subclass) => (
            <motion.div
              key={subclass.id}
              animate={shakeId === subclass.id ? { x: [-10, 10, -10, 10, 0] } : {}}
              transition={{ duration: 0.4 }}
              className="relative"
            >
              <SpotlightCard
                spotlightColor={subclass.isCorrect ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)"}
                onClick={() => handleSelect(subclass)}
                className={cn(
                  "p-6 rounded-2xl border-2 cursor-pointer transition-all group relative overflow-hidden h-full",
                  selectedId === subclass.id
                    ? subclass.isCorrect
                      ? "border-green-500 bg-green-500/10"
                      : "border-red-500 bg-red-500/10 shadow-[0_0_30px_rgba(239,68,68,0.2)]"
                    : "border-white/5 hover:border-lsp/40 hover:bg-lsp/5"
                )}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-bold text-lg">{subclass.name}</h3>
                  {selectedId === subclass.id && (
                    subclass.isCorrect ? <CheckCircle2 className="text-green-500" /> : <XCircle className="text-red-500" />
                  )}
                </div>
                <div className="code-block bg-black/40">
                  <pre className="text-xs text-white/60">{subclass.code}</pre>
                </div>

                <AnimatePresence>
                  {selectedId === subclass.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      className="mt-4 pt-4 border-t border-white/10"
                    >
                      <p className="text-sm text-white/80 leading-relaxed">
                        {subclass.description}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Background Icon Decor */}
                <div className="absolute -bottom-4 -right-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Cpu className="w-24 h-24" />
                </div>
              </SpotlightCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

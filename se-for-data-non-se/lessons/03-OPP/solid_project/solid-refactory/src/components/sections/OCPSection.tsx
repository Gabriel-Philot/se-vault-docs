import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, Plus, ArrowRight } from "lucide-react";
import { cn } from "../../lib/utils";

interface Branch {
  id: string;
  condition: string;
  targetCard: string;
  isExtracted: boolean;
  expandedCode: string;
}

const INITIAL_BRANCHES: Branch[] = [
  {
    id: "credit",
    condition: "if type == 'credit':",
    targetCard: "CreditProcessor",
    isExtracted: false,
    expandedCode: `class CreditProcessor(PaymentStrategy):\n    def execute(self, amount: float) -> None:\n        print(f"Processing \${'{'}amount{'}'} via credit card")`,
  },
  {
    id: "paypal",
    condition: "elif type == 'paypal':",
    targetCard: "PaypalProcessor",
    isExtracted: false,
    expandedCode: `class PaypalProcessor(PaymentStrategy):\n    def execute(self, amount: float) -> None:\n        print(f"Processing \${'{'}amount{'}'} via PayPal")`,
  },
  {
    id: "crypto",
    condition: "elif type == 'crypto':",
    targetCard: "CryptoProcessor",
    isExtracted: false,
    expandedCode: `class CryptoProcessor(PaymentStrategy):\n    def execute(self, amount: float) -> None:\n        print(f"Processing \${'{'}amount{'}'} via crypto wallet")`,
  },
  {
    id: "stripe",
    condition: "else:",
    targetCard: "StripeProcessor",
    isExtracted: false,
    expandedCode: `class StripeProcessor(PaymentStrategy):\n    def execute(self, amount: float) -> None:\n        print(f"Processing \${'{'}amount{'}'} via Stripe")`,
  },
];

export const OCPSection = () => {
  const [branches, setBranches] = useState<Branch[]>(INITIAL_BRANCHES);
  const [extractedCount, setExtractedCount] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showEtl, setShowEtl] = useState(false);

  const extractBranch = (id: string) => {
    setBranches(prev => prev.map(b => b.id === id ? { ...b, isExtracted: true } : b));
    setExtractedCount(prev => prev + 1);
  };

  return (
    <section id="ocp" className="min-h-screen py-24 px-6 bg-ocp/5 relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ocp/10 border border-ocp/20">
            <Layers className="w-4 h-4 text-ocp" />
            <span className="text-xs font-bold text-ocp uppercase tracking-wider">Open/Closed Principle</span>
          </div>
          <h2 className="text-5xl font-bold font-display">
            Open/<span className="text-ocp">Closed</span>
          </h2>
          <p className="text-white/40 text-sm font-mono -mt-2">Aberto/Fechado</p>
          <p className="text-white/60 max-w-2xl mx-auto">
            Entidades de software devem ser abertas para extensão, mas fechadas para modificação. Pare de adicionar branches <code className="text-ocp">if/else</code> à lógica central. Extraia-os para strategies polimórficas.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          {/* Left: Strategy Cards */}
          <div className="space-y-4 order-2 lg:order-1">
            {branches.slice(0, 2).map((branch) => (
              <StrategyCard key={branch.id} branch={branch} expandedId={expandedId} onToggleExpand={(id) => setExpandedId(expandedId === id ? null : id)} />
            ))}
          </div>

          {/* Center: The Messy Code */}
          <div className="order-1 lg:order-2">
            <div className="glass rounded-2xl p-6 border-ocp/20 shadow-2xl shadow-ocp/5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono text-white/40">PaymentProcessor.py</span>
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-ocp/40" />
                  <div className="w-2 h-2 rounded-full bg-ocp/20" />
                </div>
              </div>
              <div className="code-block min-h-[400px] relative">
                <div className="text-blue-400">def <span className="text-yellow-400">process_payment</span>(self, type, amount):</div>
                <div className="mt-4 space-y-4">
                  {branches.map((branch) => (
                    <motion.div
                      key={branch.id}
                      layout
                      className={cn(
                        "p-3 rounded border transition-all cursor-pointer group relative",
                        branch.isExtracted 
                          ? "opacity-20 border-transparent grayscale" 
                          : "bg-white/5 border-white/10 hover:border-ocp/50 hover:bg-ocp/5"
                      )}
                      onClick={() => !branch.isExtracted && extractBranch(branch.id)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm text-pink-400">{branch.condition}</span>
                        {!branch.isExtracted && (
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            whileHover={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-1 text-[10px] text-ocp font-bold uppercase"
                          >
                            Extrair <ArrowRight className="w-3 h-3" />
                          </motion.div>
                        )}
                      </div>
                      <div className="pl-4 mt-1 text-white/40 font-mono text-xs"># lógica de processamento...</div>
                      
                      {/* Flying Animation Element */}
                      <AnimatePresence>
                        {branch.isExtracted && (
                          <motion.div
                            initial={{ scale: 1, opacity: 1, x: 0, y: 0 }}
                            animate={{ 
                              scale: 0.5, 
                              opacity: 0,
                              x: branch.id.includes("credit") || branch.id.includes("paypal") ? -400 : 400,
                              y: branch.id.includes("credit") || branch.id.includes("stripe") ? -100 : 100
                            }}
                            transition={{ duration: 0.6, ease: "circOut" }}
                            className="absolute inset-0 bg-ocp rounded z-50 pointer-events-none"
                          />
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
                
                {extractedCount === branches.length && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-center"
                  >
                    <div className="text-green-400 font-mono text-sm">
                      def process(self, strategy, amount):<br/>
                      &nbsp;&nbsp;strategy.execute(amount)
                    </div>
                    <div className="text-[10px] text-green-400/60 mt-2 uppercase tracking-widest font-bold">Refatorado para OCP</div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Strategy Cards */}
          <div className="space-y-4 order-3">
            {branches.slice(2).map((branch) => (
              <StrategyCard key={branch.id} branch={branch} expandedId={expandedId} onToggleExpand={(id) => setExpandedId(expandedId === id ? null : id)} />
            ))}
          </div>
        </div>

        <div className="mt-8 space-y-2 max-w-md mx-auto">
          <button
            onClick={() => setShowEtl(!showEtl)}
            className="text-xs text-white/40 hover:text-white/70 transition-colors flex items-center gap-1"
          >
            <span>{showEtl ? '▼' : '▶'}</span> Versão ETL (Conectores de dados)
          </button>
          {showEtl && (
            <div className="glass rounded-xl p-4 border-ocp/10 code-block text-xs">
              <div className="text-blue-400">class <span className="text-yellow-400">Source</span>(ABC):</div>
              <div className="pl-4 text-white/60">@abstractmethod</div>
              <div className="pl-4 text-white/60">def read(self) -&gt; list: ...</div>
              <div className="mt-3 text-blue-400">class <span className="text-yellow-400">CsvSource</span>(Source):</div>
              <div className="pl-4 text-white/60">def read(self): return pd.read_csv(...)</div>
              <div className="mt-1 text-blue-400">class <span className="text-yellow-400">ApiSource</span>(Source):</div>
              <div className="pl-4 text-white/60">def read(self): return requests.get(...)</div>
              <div className="mt-3 text-white/40"># Pipeline não muda — apenas o Source varia</div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

interface StrategyCardProps {
  branch: Branch;
  expandedId: string | null;
  onToggleExpand: (id: string) => void;
  key?: React.Key;
}

const StrategyCard = ({ branch, expandedId, onToggleExpand }: StrategyCardProps) => {
  const isExpanded = expandedId === branch.id;
  return (
    <motion.div
      animate={{
        borderColor: branch.isExtracted ? "rgba(139, 92, 246, 0.5)" : "rgba(255, 255, 255, 0.05)",
        backgroundColor: branch.isExtracted ? "rgba(139, 92, 246, 0.1)" : "rgba(255, 255, 255, 0.02)",
      }}
      onClick={() => branch.isExtracted && onToggleExpand(branch.id)}
      className={cn("p-4 rounded-xl border flex flex-col gap-3 group", branch.isExtracted && "cursor-pointer")}
    >
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
          branch.isExtracted ? "bg-ocp text-white" : "bg-white/5 text-white/20"
        )}>
          {branch.isExtracted ? <Plus className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
        </div>
        <div>
          <h3 className={cn(
            "font-display font-bold text-sm transition-colors",
            branch.isExtracted ? "text-white" : "text-white/40"
          )}>
            {branch.targetCard}
          </h3>
          <p className="text-[10px] text-white/20 uppercase tracking-wider">PaymentStrategy</p>
        </div>
      </div>
      <AnimatePresence>
        {branch.isExtracted && isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="code-block bg-black/40 text-xs">
              <pre className="text-white/60 whitespace-pre-wrap">{branch.expandedCode}</pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

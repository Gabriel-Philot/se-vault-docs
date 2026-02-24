import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PageTitleBlock } from "../components/PageTitleBlock";
import { GlassPanel } from "../components/GlassPanel";
import { Play, Pause, SkipForward, RotateCcw } from "lucide-react";
import { cn } from "../utils/cn";

export function MemoryVisualizer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [step, setStep] = useState(0);

  const stackFrames = [
    { id: 1, name: "main()", vars: ["x = 10", "y = 20"], active: step >= 1 },
    { id: 2, name: "calculate()", vars: ["a = 10", "b = 20"], active: step >= 2 },
    { id: 3, name: "add()", vars: ["result = 30"], active: step >= 3 },
  ];

  const heapBlocks = [
    { id: 1, size: "32 bytes", address: "0x1000", active: step >= 2 },
    { id: 2, size: "64 bytes", address: "0x1020", active: step >= 4 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageTitleBlock
        eyebrow="Panel 04"
        title="Stack vs Heap Visualizer"
        subtitle="Visualize memory allocation, stack frames, and pointer behavior."
        accentColor="blue"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls & Code */}
        <GlassPanel accentColor="blue" className="p-6 lg:col-span-1 flex flex-col gap-6">
          <div className="flex items-center justify-between bg-slate-900 rounded-lg p-2 border border-slate-800">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 rounded-md bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setStep((prev) => Math.min(prev + 1, 5))}
              className="p-2 rounded-md text-slate-400 hover:text-blue-400 transition-colors"
            >
              <SkipForward className="w-5 h-5" />
            </button>
            <button
              onClick={() => setStep(0)}
              className="p-2 rounded-md text-slate-400 hover:text-red-400 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <div className="text-xs font-mono text-slate-500 px-2 border-l border-slate-800">
              Step: {step}/5
            </div>
          </div>

          <div className="flex-1 bg-slate-950 rounded-md border border-slate-800 p-4 font-mono text-sm overflow-y-auto">
            <pre className="text-slate-300">
              <code>
                <div className={cn("py-1 px-2 rounded", step === 1 && "bg-blue-500/20 text-blue-300")}>
                  void main() {"{"}
                </div>
                <div className={cn("py-1 px-2 rounded", step === 2 && "bg-blue-500/20 text-blue-300")}>
                  {"  "}int* ptr = malloc(32);
                </div>
                <div className={cn("py-1 px-2 rounded", step === 3 && "bg-blue-500/20 text-blue-300")}>
                  {"  "}calculate(ptr);
                </div>
                <div className={cn("py-1 px-2 rounded", step === 4 && "bg-blue-500/20 text-blue-300")}>
                  {"  "}free(ptr);
                </div>
                <div className={cn("py-1 px-2 rounded", step === 5 && "bg-blue-500/20 text-blue-300")}>
                  {"}"}
                </div>
              </code>
            </pre>
          </div>
        </GlassPanel>

        {/* Stack & Heap Visualization */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-6">
          {/* Stack */}
          <GlassPanel accentColor="blue" className="p-6 flex flex-col relative overflow-hidden">
            <h3 className="text-xs font-mono text-blue-400 mb-4 uppercase tracking-wider text-center border-b border-slate-800 pb-2">
              Stack Memory
            </h3>
            <div className="flex-1 flex flex-col-reverse justify-start gap-2 pt-4">
              <AnimatePresence>
                {stackFrames.filter((f) => f.active).map((frame, i) => (
                  <motion.div
                    key={frame.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="bg-slate-900 border border-blue-500/30 rounded-lg p-3 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                  >
                    <div className="text-sm font-mono font-bold text-blue-300 mb-2 border-b border-slate-800 pb-1">
                      {frame.name}
                    </div>
                    {frame.vars.map((v, j) => (
                      <div key={j} className="text-xs font-mono text-slate-400 flex justify-between">
                        <span>{v.split("=")[0]}</span>
                        <span className="text-slate-300">{v.split("=")[1]}</span>
                      </div>
                    ))}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
          </GlassPanel>

          {/* Heap */}
          <GlassPanel accentColor="blue" className="p-6 flex flex-col relative overflow-hidden">
            <h3 className="text-xs font-mono text-purple-400 mb-4 uppercase tracking-wider text-center border-b border-slate-800 pb-2">
              Heap Memory
            </h3>
            <div className="flex-1 flex flex-wrap content-start gap-4 pt-4">
              <AnimatePresence>
                {heapBlocks.filter((b) => b.active).map((block) => (
                  <motion.div
                    key={block.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8, filter: "blur(4px)" }}
                    transition={{ duration: 0.3 }}
                    className="w-full bg-slate-900 border border-purple-500/30 rounded-lg p-3 shadow-[0_0_15px_rgba(168,85,247,0.1)] flex items-center justify-between"
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-mono text-purple-400">{block.address}</span>
                      <span className="text-sm font-mono text-slate-300">{block.size}</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/50">
                      <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}

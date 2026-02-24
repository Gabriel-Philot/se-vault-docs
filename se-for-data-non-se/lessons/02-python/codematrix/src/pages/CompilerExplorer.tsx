import { useState } from "react";
import { motion } from "motion/react";
import { PageTitleBlock } from "../components/PageTitleBlock";
import { GlassPanel } from "../components/GlassPanel";
import { Cpu, FileCode2, Play, CheckCircle2, CircleDashed } from "lucide-react";
import { cn } from "../utils/cn";

export function CompilerExplorer() {
  const [activeTab, setActiveTab] = useState<"c" | "python">("c");
  const [pipelineState, setPipelineState] = useState<"pending" | "active" | "done">("pending");

  const cStages = ["Source Code", "Preprocessor", "Compiler", "Assembler", "Linker", "Executable"];
  const pyStages = ["Source Code", "Bytecode Compiler", "PVM (Interpreter)", "Execution"];

  const stages = activeTab === "c" ? cStages : pyStages;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageTitleBlock
        eyebrow="Panel 03"
        title="Compiled vs Interpreted"
        subtitle="Compare C compilation pipeline vs Python interpretation stages."
        accentColor="amber"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Language Selection & Editor */}
        <GlassPanel accentColor="amber" className="p-6 lg:col-span-1 flex flex-col gap-6">
          <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
            <button
              onClick={() => setActiveTab("c")}
              className={cn(
                "flex-1 py-2 text-sm font-medium rounded-md transition-all",
                activeTab === "c" ? "bg-amber-500/20 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]" : "text-slate-400 hover:text-slate-200"
              )}
            >
              C (Compiled)
            </button>
            <button
              onClick={() => setActiveTab("python")}
              className={cn(
                "flex-1 py-2 text-sm font-medium rounded-md transition-all",
                activeTab === "python" ? "bg-purple-500/20 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.2)]" : "text-slate-400 hover:text-slate-200"
              )}
            >
              Python (Interpreted)
            </button>
          </div>

          <div className="flex-1 bg-slate-950 rounded-md border border-slate-800 p-4 font-mono text-sm overflow-y-auto">
            <div className="flex items-center gap-2 mb-4 text-slate-500 border-b border-slate-800 pb-2">
              <FileCode2 className="w-4 h-4" />
              <span>{activeTab === "c" ? "main.c" : "main.py"}</span>
            </div>
            {activeTab === "c" ? (
              <pre className="text-amber-300">
                <code>
                  #include &lt;stdio.h&gt;{"\n\n"}
                  int main() {"{"}{"\n"}
                  {"  "}printf("Hello, World!\\n");{"\n"}
                  {"  "}return 0;{"\n"}
                  {"}"}
                </code>
              </pre>
            ) : (
              <pre className="text-purple-300">
                <code>
                  def main():{"\n"}
                  {"  "}print("Hello, World!"){"\n\n"}
                  if __name__ == "__main__":{"\n"}
                  {"  "}main()
                </code>
              </pre>
            )}
          </div>

          <button
            onClick={() => setPipelineState("active")}
            className={cn(
              "w-full py-3 rounded-md font-medium flex items-center justify-center gap-2 transition-all",
              activeTab === "c" ? "bg-amber-500 hover:bg-amber-600 text-slate-950" : "bg-purple-500 hover:bg-purple-600 text-white"
            )}
          >
            <Play className="w-4 h-4" />
            {activeTab === "c" ? "Compile & Run" : "Execute"}
          </button>
        </GlassPanel>

        {/* Pipeline Stepper & Metrics */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <GlassPanel accentColor={activeTab === "c" ? "amber" : "purple"} className="p-6 flex-1">
            <h3 className={cn("text-xs font-mono mb-6 uppercase tracking-wider", activeTab === "c" ? "text-amber-400" : "text-purple-400")}>
              Execution Pipeline
            </h3>
            
            <div className="flex justify-between items-center relative">
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-800 -z-10 transform -translate-y-1/2" />
              
              {stages.map((stage, i) => (
                <div key={stage} className="flex flex-col items-center gap-3 relative z-10">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0.5 }}
                    animate={{ scale: pipelineState === "active" ? 1.1 : 1, opacity: 1 }}
                    transition={{ delay: i * 0.2 }}
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                      pipelineState === "active" 
                        ? (activeTab === "c" ? "bg-amber-500/20 border-amber-400 text-amber-400" : "bg-purple-500/20 border-purple-400 text-purple-400")
                        : "bg-slate-900 border-slate-700 text-slate-500"
                    )}
                  >
                    {pipelineState === "done" ? <CheckCircle2 className="w-5 h-5" /> : <CircleDashed className="w-5 h-5" />}
                  </motion.div>
                  <span className="text-xs font-mono text-slate-400 text-center max-w-[80px] leading-tight">
                    {stage}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-12 bg-slate-950 rounded border border-slate-800 p-4 font-mono text-sm">
              <div className="text-slate-500 mb-2">Output:</div>
              {pipelineState === "active" ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: stages.length * 0.2 }}
                  onAnimationComplete={() => setPipelineState("done")}
                  className="text-slate-300"
                >
                  Hello, World!
                </motion.div>
              ) : pipelineState === "done" ? (
                <div className="text-slate-300">Hello, World!</div>
              ) : (
                <div className="text-slate-700 italic">Waiting for execution...</div>
              )}
            </div>
          </GlassPanel>

          <div className="grid grid-cols-2 gap-6">
            <GlassPanel accentColor={activeTab === "c" ? "amber" : "purple"} className="p-6">
              <h3 className="text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Execution Time</h3>
              <div className={cn("text-3xl font-mono font-bold", activeTab === "c" ? "text-amber-400" : "text-purple-400")}>
                {activeTab === "c" ? "0.002s" : "0.045s"}
              </div>
            </GlassPanel>
            <GlassPanel accentColor={activeTab === "c" ? "amber" : "purple"} className="p-6">
              <h3 className="text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Memory Usage</h3>
              <div className={cn("text-3xl font-mono font-bold", activeTab === "c" ? "text-amber-400" : "text-purple-400")}>
                {activeTab === "c" ? "1.2 MB" : "8.5 MB"}
              </div>
            </GlassPanel>
          </div>
        </div>
      </div>
    </div>
  );
}

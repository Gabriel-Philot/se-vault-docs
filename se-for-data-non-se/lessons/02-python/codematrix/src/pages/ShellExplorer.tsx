import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { PageTitleBlock } from "../components/PageTitleBlock";
import { GlassPanel } from "../components/GlassPanel";
import { Terminal, Folder, File, Lock, User, Shield } from "lucide-react";
import { cn } from "../utils/cn";

export function ShellExplorer() {
  const [command, setCommand] = useState("");
  const [output, setOutput] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<"alice" | "root">("alice");

  // Simulate SSE stream consumption for terminal output
  const executeCommand = (cmd: string) => {
    setOutput((prev) => [...prev, `$ ${cmd}`]);
    if (cmd === "whoami") {
      setOutput((prev) => [...prev, currentUser]);
    } else if (cmd === "ls -la") {
      setOutput((prev) => [
        ...prev,
        "drwxr-xr-x 2 alice users 4096 Jan 1 12:00 .",
        "-rw-r--r-- 1 alice users   24 Jan 1 12:00 file.txt",
        "-rwx------ 1 root  root   100 Jan 1 12:00 secret.sh",
      ]);
    } else {
      setOutput((prev) => [...prev, `bash: ${cmd}: command not found`]);
    }
    setCommand("");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageTitleBlock
        eyebrow="Panel 02"
        title="Shell & Process Explorer"
        subtitle="Explore Linux filesystem, streams, pipes, and process execution."
        accentColor="green"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filesystem Tree */}
        <GlassPanel accentColor="green" className="p-6 lg:col-span-1 flex flex-col gap-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-mono text-emerald-400 uppercase tracking-wider">Filesystem</h3>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentUser("alice")}
                className={cn("px-2 py-1 text-xs font-mono rounded flex items-center gap-1", currentUser === "alice" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50" : "text-slate-500 border border-transparent")}
              >
                <User className="w-3 h-3" /> alice
              </button>
              <button 
                onClick={() => setCurrentUser("root")}
                className={cn("px-2 py-1 text-xs font-mono rounded flex items-center gap-1", currentUser === "root" ? "bg-red-500/20 text-red-400 border border-red-500/50" : "text-slate-500 border border-transparent")}
              >
                <Shield className="w-3 h-3" /> root
              </button>
            </div>
          </div>

          <div className="font-mono text-sm flex flex-col gap-2">
            <div className="flex items-center gap-2 text-slate-300">
              <Folder className="w-4 h-4 text-emerald-500" />
              <span>/home/alice</span>
            </div>
            <div className="ml-4 flex flex-col gap-2 border-l border-slate-800 pl-4">
              <div className="flex items-center gap-2 text-slate-400 hover:text-emerald-300 transition-colors cursor-pointer">
                <File className="w-4 h-4" />
                <span>.bashrc</span>
                <span className="text-[10px] text-slate-600 ml-auto">rw-r--r--</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 hover:text-emerald-300 transition-colors cursor-pointer">
                <File className="w-4 h-4" />
                <span>file.txt</span>
                <span className="text-[10px] text-slate-600 ml-auto">rw-r--r--</span>
              </div>
              <div className="flex items-center gap-2 text-red-400/70 hover:text-red-400 transition-colors cursor-pointer">
                <Lock className="w-4 h-4 text-red-500" />
                <span>secret.sh</span>
                <span className="text-[10px] text-red-500/50 ml-auto">rwx------</span>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-slate-800">
            <h3 className="text-xs font-mono text-emerald-400 mb-2 uppercase tracking-wider">Environment</h3>
            <div className="bg-slate-950 rounded p-3 text-xs font-mono text-slate-400 border border-slate-800 overflow-x-auto">
              <div className="flex gap-2 mb-1">
                <span className="text-emerald-500">USER=</span>
                <span className="text-slate-300">{currentUser}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-emerald-500">PATH=</span>
                <span className="text-slate-300">/usr/bin:/bin</span>
              </div>
            </div>
          </div>
        </GlassPanel>

        {/* Terminal & Streams */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <GlassPanel accentColor="green" className="p-6 flex-1 flex flex-col relative overflow-hidden">
            {/* Scanline overlay */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-10 opacity-20" />
            
            <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-4">
              <Terminal className="w-5 h-5 text-emerald-500" />
              <h3 className="text-xs font-mono text-emerald-400 uppercase tracking-wider">Terminal Session</h3>
            </div>

            <div className="flex-1 bg-slate-950 rounded-md border border-slate-800 p-4 font-mono text-sm overflow-y-auto flex flex-col">
              {output.map((line, i) => (
                <div key={i} className={line.startsWith("$") ? "text-emerald-400 mt-2" : "text-slate-300"}>
                  {line}
                </div>
              ))}
              <div className="flex items-center gap-2 mt-2 text-emerald-400">
                <span>{currentUser}@linux:~$</span>
                <input
                  type="text"
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && command.trim()) {
                      executeCommand(command);
                    }
                  }}
                  className="flex-1 bg-transparent outline-none text-emerald-300"
                  autoFocus
                />
                <motion.span 
                  animate={{ opacity: [1, 0] }} 
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  className="w-2 h-4 bg-emerald-500 inline-block ml-1"
                />
              </div>
            </div>
          </GlassPanel>

          {/* Layer Diagram */}
          <GlassPanel accentColor="green" className="p-6">
            <h3 className="text-xs font-mono text-emerald-400 mb-4 uppercase tracking-wider">Execution Flow</h3>
            <div className="flex items-center justify-between gap-2">
              {["User", "Shell", "Kernel", "Hardware"].map((layer, i) => (
                <div key={layer} className="flex-1 flex flex-col items-center">
                  <motion.div 
                    className={cn(
                      "w-full py-3 rounded text-center text-xs font-mono border transition-colors",
                      i === 1 ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]" : "bg-slate-900 border-slate-800 text-slate-500"
                    )}
                  >
                    {layer}
                  </motion.div>
                  {i < 3 && <div className="h-4 w-px bg-slate-800 my-1" />}
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}

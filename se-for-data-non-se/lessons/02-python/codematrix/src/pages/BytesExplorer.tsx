import { useState } from "react";
import { motion } from "motion/react";
import { PageTitleBlock } from "../components/PageTitleBlock";
import { GlassPanel } from "../components/GlassPanel";
import { cn } from "../utils/cn";

export function BytesExplorer() {
  const [inputValue, setInputValue] = useState("A");
  const [detectedType, setDetectedType] = useState("char");

  // Mock data for bits
  const bits = [0, 1, 0, 0, 0, 0, 0, 1];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageTitleBlock
        eyebrow="Panel 01"
        title="Bytes Explorer"
        subtitle="Understand encodings, memory representation, and bitwise operations."
        accentColor="cyan"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input & Type Detection */}
        <GlassPanel accentColor="cyan" className="p-6 lg:col-span-1 flex flex-col gap-6">
          <div>
            <label className="block text-xs font-mono text-cyan-400 mb-2 uppercase tracking-wider">Input Value</label>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-md px-4 py-3 text-white font-mono focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              placeholder="Enter a number or string..."
            />
          </div>
          
          <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-mono text-slate-500 uppercase">Detected Type</span>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded">{detectedType}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-mono text-slate-500 uppercase">Size (C)</span>
              <span className="text-sm font-mono text-white">1 byte</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono text-slate-500 uppercase">Size (Python)</span>
              <span className="text-sm font-mono text-white">50 bytes</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-cyan-400 mb-2 uppercase tracking-wider">Memory Tanks</label>
            <div className="flex gap-4 items-end h-32 mt-4">
              <div className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-slate-800 rounded-t-md relative overflow-hidden flex-1 border-x border-t border-slate-700">
                  <motion.div 
                    className="absolute bottom-0 left-0 w-full bg-cyan-500/50 border-t border-cyan-400"
                    initial={{ height: 0 }}
                    animate={{ height: "10%" }}
                    transition={{ type: "spring", stiffness: 100 }}
                  />
                </div>
                <span className="text-xs font-mono text-slate-400">C (1B)</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-slate-800 rounded-t-md relative overflow-hidden flex-1 border-x border-t border-slate-700">
                  <motion.div 
                    className="absolute bottom-0 left-0 w-full bg-purple-500/50 border-t border-purple-400"
                    initial={{ height: 0 }}
                    animate={{ height: "80%" }}
                    transition={{ type: "spring", stiffness: 100 }}
                  />
                </div>
                <span className="text-xs font-mono text-slate-400">Py (50B)</span>
              </div>
            </div>
          </div>
        </GlassPanel>

        {/* Bit Representation & Hex Dump */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <GlassPanel accentColor="cyan" className="p-6">
            <h3 className="text-xs font-mono text-cyan-400 mb-4 uppercase tracking-wider">Bit Representation</h3>
            <div className="flex flex-wrap gap-2 justify-center py-8">
              {bits.map((bit, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn(
                    "w-12 h-16 rounded-md flex items-center justify-center text-2xl font-mono font-bold border transition-colors",
                    bit === 1 
                      ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]" 
                      : "bg-slate-800 border-slate-700 text-slate-500"
                  )}
                >
                  {bit}
                </motion.div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4 text-center border-t border-slate-800 pt-4">
              <div>
                <div className="text-xs font-mono text-slate-500 mb-1">Binary</div>
                <div className="font-mono text-white">01000001</div>
              </div>
              <div>
                <div className="text-xs font-mono text-slate-500 mb-1">Hex</div>
                <div className="font-mono text-cyan-400">0x41</div>
              </div>
              <div>
                <div className="text-xs font-mono text-slate-500 mb-1">Decimal</div>
                <div className="font-mono text-white">65</div>
              </div>
            </div>
          </GlassPanel>

          <GlassPanel accentColor="cyan" className="p-6 flex-1">
            <h3 className="text-xs font-mono text-cyan-400 mb-4 uppercase tracking-wider">Hex Dump</h3>
            <div className="bg-slate-950 rounded border border-slate-800 p-4 font-mono text-sm overflow-x-auto">
              <div className="flex text-slate-500 mb-2 border-b border-slate-800 pb-2">
                <div className="w-24">Offset</div>
                <div className="flex-1 flex gap-4">
                  <span>00 01 02 03 04 05 06 07</span>
                  <span>08 09 0A 0B 0C 0D 0E 0F</span>
                </div>
                <div className="w-32 text-right">ASCII</div>
              </div>
              <div className="flex text-slate-300 hover:bg-slate-900/50 transition-colors py-1">
                <div className="w-24 text-slate-500">0x00000000</div>
                <div className="flex-1 flex gap-4">
                  <span className="text-cyan-400">41</span>
                  <span className="text-slate-600">00 00 00 00 00 00 00</span>
                  <span className="text-slate-600">00 00 00 00 00 00 00 00</span>
                </div>
                <div className="w-32 text-right text-cyan-400">A....... ........</div>
              </div>
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}

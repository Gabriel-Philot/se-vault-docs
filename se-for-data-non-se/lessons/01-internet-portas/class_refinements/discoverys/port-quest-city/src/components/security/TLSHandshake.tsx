import React, { useState } from 'react';
import { Lock, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import { GlassPanel } from '../shared/GlassPanel';
import { api } from '../../lib/api';
import { TLSStep } from '../../lib/types';

export function TLSHandshake() {
  const [steps, setSteps] = useState<TLSStep[]>([]);
  const [activeStep, setActiveStep] = useState(-1);
  const [running, setRunning] = useState(false);

  const startHandshake = async () => {
    setRunning(true);
    try {
      const res = await api.getTLSHandshake();
      setSteps(res.steps);
      
      // Animate steps
      for (let i = 0; i < res.steps.length; i++) {
        await new Promise(r => setTimeout(r, 600));
        setActiveStep(i);
      }
    } catch (e) {
      console.error(e);
    }
    setRunning(false);
  };

  return (
    <GlassPanel accent="#ffee44" className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Lock className="w-6 h-6 text-pq-yellow" />
          <h2 className="text-xl font-bold text-white">TLS Handshake</h2>
        </div>
        <button
          onClick={startHandshake}
          disabled={running}
          className="bg-pq-yellow text-black px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 disabled:opacity-50"
        >
          <Play className="w-4 h-4" />
          SIMULATE
        </button>
      </div>

      <div className="relative flex justify-between items-center mt-8">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-white/10" />
        {steps.length > 0 ? steps.map((step, i) => (
          <div key={step.step_number} className="relative z-10 flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0.5 }}
              animate={{ 
                scale: activeStep >= i ? 1.2 : 0.8,
                opacity: activeStep >= i ? 1 : 0.5,
                backgroundColor: activeStep >= i ? '#ffee44' : '#333'
              }}
              className="w-4 h-4 rounded-full border-2 border-pq-bg"
            />
            <div className="absolute top-6 w-24 text-center">
              <div className="text-[10px] font-bold text-pq-yellow mb-1">{step.name}</div>
            </div>
          </div>
        )) : (
          <div className="w-full text-center text-slate-500 italic text-sm py-4">
            Click simulate to view handshake steps
          </div>
        )}
      </div>
      
      {activeStep >= 0 && steps[activeStep] && (
        <motion.div 
          key={activeStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-16 bg-black/30 p-4 rounded-lg border border-white/5"
        >
          <h4 className="text-pq-yellow font-bold text-sm mb-2">{steps[activeStep].name}</h4>
          <p className="text-slate-300 text-sm mb-2">{steps[activeStep].description}</p>
          <pre className="text-xs font-mono text-slate-400 bg-black/50 p-2 rounded">
            {JSON.stringify(steps[activeStep].data, null, 2)}
          </pre>
        </motion.div>
      )}
    </GlassPanel>
  );
}

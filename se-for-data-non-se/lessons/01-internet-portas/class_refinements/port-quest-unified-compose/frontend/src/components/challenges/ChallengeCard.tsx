import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, CheckCircle, XCircle } from 'lucide-react';
import { GlassPanel } from '../shared/GlassPanel';
import { ChallengeData, ChallengeResult } from '../../lib/types';
import { api } from '../../lib/api';

interface ChallengeCardProps {
  challenge: ChallengeData;
  onScoreUpdate: (score: number) => void;
}

export function ChallengeCard({ challenge, onScoreUpdate }: ChallengeCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<ChallengeResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'port_match': return 'bg-pq-blue/20 text-pq-blue border-pq-blue/30';
      case 'firewall': return 'bg-pq-red/20 text-pq-red border-pq-red/30';
      case 'dns': return 'bg-pq-yellow/20 text-pq-yellow border-pq-yellow/30';
      case 'protocol': return 'bg-pq-pink/20 text-pq-pink border-pq-pink/30';
      default: return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  const getAccentColor = (type: string) => {
    switch (type) {
      case 'port_match': return '#00ccff';
      case 'firewall': return '#ff4444';
      case 'dns': return '#ffee44';
      case 'protocol': return '#ff44aa';
      default: return '#ffffff';
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await api.submitChallenge(challenge.id, answer);
      setResult(res);
      if (res.correct) {
        onScoreUpdate(res.score);
      }
    } catch (e) {
      console.error(e);
    }
    setSubmitting(false);
  };

  return (
    <GlassPanel 
      accent={result?.correct ? '#00ff88' : result?.correct === false ? '#ff4444' : getAccentColor(challenge.type)} 
      className="flex flex-col transition-all duration-300"
    >
      <div 
        className="p-6 cursor-pointer flex items-start justify-between"
        onClick={() => setExpanded(!expanded)}
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${getBadgeColor(challenge.type)}`}>
              {challenge.type.toUpperCase()}
            </span>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">{challenge.title}</h3>
          {!expanded && (
            <p className="text-slate-400 text-sm line-clamp-2">{challenge.description}</p>
          )}
        </div>
        <button className="text-slate-400 hover:text-white mt-1">
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-6 pt-0 border-t border-white/10 mt-2">
              <p className="text-slate-300 mb-6 mt-4">{challenge.description}</p>
              
              {challenge.hints && challenge.hints.length > 0 && (
                <div className="mb-6 bg-black/20 p-4 rounded-lg border border-white/5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Hints</h4>
                  <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
                    {challenge.hints.map((hint, i) => (
                      <li key={i}>{hint}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Your Answer</label>
                  <input
                    type="text"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    disabled={result?.correct}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white font-mono focus:outline-none focus:border-pq-blue/50 disabled:opacity-50"
                    placeholder="Enter answer..."
                  />
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !answer || result?.correct}
                  className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg font-bold transition-colors disabled:opacity-50"
                >
                  SUBMIT
                </button>
              </div>

              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-6 p-4 rounded-lg border flex items-start gap-3 ${result.correct ? 'bg-pq-green/10 border-pq-green/30' : 'bg-pq-red/10 border-pq-red/30'}`}
                >
                  {result.correct ? (
                    <CheckCircle className="w-6 h-6 text-pq-green shrink-0" />
                  ) : (
                    <XCircle className="w-6 h-6 text-pq-red shrink-0" />
                  )}
                  <div>
                    <h4 className={`font-bold mb-1 ${result.correct ? 'text-pq-green' : 'text-pq-red'}`}>
                      {result.correct ? 'CORRECT!' : 'WRONG!'}
                    </h4>
                    <p className="text-sm text-slate-300">{result.explanation}</p>
                    {result.correct && (
                      <div className="mt-2 text-xs font-bold text-pq-yellow">+{result.score} Points</div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassPanel>
  );
}

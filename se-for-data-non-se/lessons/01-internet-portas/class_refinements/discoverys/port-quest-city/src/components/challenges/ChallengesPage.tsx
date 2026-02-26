import React, { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';
import { PageTitleBlock } from '../shared/PageTitleBlock';
import { ChallengeCard } from './ChallengeCard';
import { api } from '../../lib/api';
import { ChallengeData } from '../../lib/types';
import { GlassPanel } from '../shared/GlassPanel';

export function ChallengesPage() {
  const [challenges, setChallenges] = useState<ChallengeData[]>([]);
  const [score, setScore] = useState(0);

  useEffect(() => {
    api.getChallenges().then(setChallenges).catch(console.error);
  }, []);

  return (
    <div className="h-full">
      <div className="flex items-start justify-between mb-8">
        <PageTitleBlock 
          eyebrow="TRAINING" 
          title="Challenges" 
          subtitle="Test your knowledge of ports, protocols, and security." 
        />
        <GlassPanel accent="#ffee44" className="px-6 py-4 flex items-center gap-4">
          <Trophy className="w-8 h-8 text-pq-yellow" />
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Score</div>
            <div className="text-3xl font-mono font-bold text-white">{score}</div>
          </div>
        </GlassPanel>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {challenges.map(challenge => (
          <ChallengeCard 
            key={challenge.id} 
            challenge={challenge} 
            onScoreUpdate={(points) => setScore(s => s + points)} 
          />
        ))}
        {challenges.length === 0 && (
          <div className="col-span-full text-center text-slate-500 italic py-12">
            Loading challenges...
          </div>
        )}
      </div>
    </div>
  );
}

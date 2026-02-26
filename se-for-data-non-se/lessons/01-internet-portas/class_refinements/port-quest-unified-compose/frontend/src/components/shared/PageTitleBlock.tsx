import React from 'react';

interface PageTitleBlockProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
}

export function PageTitleBlock({ eyebrow, title, subtitle }: PageTitleBlockProps) {
  return (
    <div className="mb-8">
      <div className="inline-flex flex-col rounded-2xl border border-white/10 bg-black/35 px-4 py-3 shadow-[0_12px_30px_rgba(0,0,0,0.28)] backdrop-blur-sm">
        <div className="text-xs font-semibold tracking-widest text-slate-300 uppercase mb-2">
          {eyebrow}
        </div>
        <h1
          className="text-4xl font-bold tracking-tight text-white mb-1"
          style={{
            textShadow:
              '0 2px 2px rgba(0,0,0,0.7), 0 0 18px rgba(0,0,0,0.45), 0 0 1px rgba(255,255,255,0.3)',
          }}
        >
          {title}
        </h1>
      </div>
      <div className="h-px w-full max-w-md bg-gradient-to-r from-pq-blue/50 via-pq-purple/50 to-transparent mb-4" />
      {subtitle && (
        <p className="text-slate-200 max-w-2xl text-lg leading-relaxed drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]">
          {subtitle}
        </p>
      )}
    </div>
  );
}

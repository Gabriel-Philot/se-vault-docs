import React from 'react';

interface PageTitleBlockProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
}

export function PageTitleBlock({ eyebrow, title, subtitle }: PageTitleBlockProps) {
  return (
    <div className="mb-8">
      <div className="text-xs font-semibold tracking-widest text-slate-400 uppercase mb-2">
        {eyebrow}
      </div>
      <h1 className="text-4xl font-bold tracking-tight text-white mb-4 drop-shadow-md">
        {title}
      </h1>
      <div className="h-px w-full max-w-md bg-gradient-to-r from-pq-blue/50 via-pq-purple/50 to-transparent mb-4" />
      {subtitle && (
        <p className="text-slate-300 max-w-2xl text-lg leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}

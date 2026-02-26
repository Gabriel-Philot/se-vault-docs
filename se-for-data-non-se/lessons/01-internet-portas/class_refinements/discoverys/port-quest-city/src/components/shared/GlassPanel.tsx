import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  accent?: string;
  children: React.ReactNode;
}

export function GlassPanel({ accent, className, children, ...props }: GlassPanelProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl glass-panel',
        className
      )}
      style={accent ? { borderColor: `${accent}40`, boxShadow: `0 4px 24px -12px ${accent}60` } : undefined}
      {...props}
    >
      {accent && (
        <div
          className="absolute top-0 left-0 w-full h-[2px]"
          style={{
            background: `linear-gradient(90deg, transparent, ${accent}b3, transparent)`,
          }}
        />
      )}
      {children}
    </div>
  );
}

import React from 'react';

interface RiskBadgeProps {
  level: 'Critical' | 'High' | 'Moderate' | 'Low' | 'Resolved' | string;
  size?: 'sm' | 'md' | 'lg';
  showPulse?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level = 'Moderate',
  size = 'md',
  showPulse = true
}) => {
  const safeLevel = (level && typeof level === 'string' && level.length > 0) ? level : 'Moderate';
  const normalized = safeLevel.charAt(0).toUpperCase() + safeLevel.slice(1).toLowerCase();

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotColor = 'bg-slate-400';
  let isPulsing = false;

  switch (normalized) {
    case 'Critical':
      colorClasses = 'bg-rose-50 text-rose-800 border-rose-200';
      dotColor = 'bg-rose-600';
      isPulsing = showPulse;
      break;
    case 'High':
      colorClasses = 'bg-amber-50 text-amber-900 border-amber-200';
      dotColor = 'bg-amber-600';
      isPulsing = showPulse;
      break;
    case 'Moderate':
      colorClasses = 'bg-yellow-50 text-yellow-900 border-yellow-200';
      dotColor = 'bg-yellow-500';
      break;
    case 'Low':
      colorClasses = 'bg-emerald-50 text-emerald-800 border-emerald-200';
      dotColor = 'bg-emerald-600';
      break;
    case 'Resolved':
      colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
      dotColor = 'bg-slate-500';
      break;
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1.5',
    md: 'px-2.5 py-1 text-xs font-semibold gap-2',
    lg: 'px-3 py-1.5 text-sm font-semibold gap-2.5'
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-xs transition-colors font-medium tracking-wide uppercase ${sizeClasses} ${colorClasses}`}
    >
      <span className="relative flex h-2 w-2">
        {isPulsing && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColor}`}
          />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`} />
      </span>
      {normalized}
    </span>
  );
};

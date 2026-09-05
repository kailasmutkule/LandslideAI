import React, { useState, useEffect, useRef } from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  unit?: string;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    label: string;
  };
  highlight?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  unit = '',
  subtitle,
  icon: Icon,
  iconColor = 'text-blue-600 bg-blue-50',
  trend,
  highlight = false
}) => {
  const isNumeric = typeof value === 'number';
  const [displayValue, setDisplayValue] = useState<number>(isNumeric ? 0 : 0);
  const hasAnimatedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isNumeric) return;
    const target = value as number;

    // Animate once on initial mount/load only, per Section 2 requirements
    if (!hasAnimatedRef.current) {
      hasAnimatedRef.current = true;
      const duration = 900;
      const steps = 24;
      const stepDuration = duration / steps;
      let step = 0;

      const timer = setInterval(() => {
        step++;
        const progress = step / steps;
        // Ease-out cubic
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(target * easeOut);
        setDisplayValue(current);

        if (step >= steps) {
          clearInterval(timer);
          setDisplayValue(target);
        }
      }, stepDuration);

      return () => clearInterval(timer);
    } else {
      // Subsequent data refreshes update directly without re-animating count-up
      setDisplayValue(target);
    }
  }, [value, isNumeric]);

  return (
    <div
      className={`tilt-card relative overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md ${
        highlight
          ? 'border-rose-300 ring-1 ring-rose-200/50'
          : 'border-slate-200/80 hover:border-slate-300'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </p>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-bold tracking-tight text-slate-900">
              {isNumeric ? displayValue : value}
            </span>
            {unit && <span className="text-sm font-semibold text-slate-500">{unit}</span>}
          </div>
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconColor}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
          {subtitle && <span className="text-slate-500 truncate">{subtitle}</span>}
          {trend && (
            <span
              className={`font-semibold ml-auto flex items-center gap-1 ${
                trend.direction === 'up'
                  ? 'text-rose-600'
                  : trend.direction === 'down'
                  ? 'text-emerald-600'
                  : 'text-slate-500'
              }`}
            >
              {trend.direction === 'up' ? '▲' : trend.direction === 'down' ? '▼' : '●'} {trend.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

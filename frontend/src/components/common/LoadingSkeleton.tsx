import React from 'react';

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs animate-pulse"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-2.5 w-2/3">
              <div className="h-3 bg-slate-200 rounded w-1/2"></div>
              <div className="h-7 bg-slate-200 rounded w-3/4"></div>
            </div>
            <div className="h-10 w-10 bg-slate-200 rounded-xl"></div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between">
            <div className="h-3 bg-slate-200 rounded w-1/3"></div>
            <div className="h-3 bg-slate-200 rounded w-1/4"></div>
          </div>
        </div>
      ))}
    </>
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden animate-pulse">
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
        <div className="h-5 bg-slate-200 rounded w-48"></div>
        <div className="h-8 bg-slate-200 rounded w-32"></div>
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 flex items-center justify-between gap-4">
            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
            <div className="h-4 bg-slate-200 rounded w-1/6"></div>
            <div className="h-4 bg-slate-200 rounded w-1/6"></div>
            <div className="h-6 bg-slate-200 rounded-full w-20"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const MapSkeleton: React.FC = () => {
  return (
    <div className="w-full h-full min-h-[400px] rounded-2xl bg-slate-100 border border-slate-200/80 flex flex-col items-center justify-center animate-pulse p-6">
      <div className="w-12 h-12 rounded-full border-4 border-slate-300 border-t-blue-600 animate-spin mb-4" />
      <p className="text-sm font-semibold text-slate-600">Loading Geospatial & Satellite Layers...</p>
      <p className="text-xs text-slate-400 mt-1">Connecting to CartoDEM & OpenTopoMap relief feed</p>
    </div>
  );
};

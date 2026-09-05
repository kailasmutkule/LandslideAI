import React from 'react';
import { AlertTriangle, RefreshCw, ServerOff } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  compact?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Service Unavailable',
  message = 'Unable to fetch data from the Landslide AI Service. The backend API may be offline or initializing.',
  onRetry,
  compact = false
}) => {
  if (compact) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 text-rose-900 flex items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2.5">
          <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
          <span>{message}</span>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-rose-300 text-rose-700 font-medium hover:bg-rose-50 text-xs shadow-2xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs max-w-lg mx-auto my-8">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 mb-4">
        <ServerOff className="h-7 w-7" />
      </div>
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600 leading-relaxed">{message}</p>
      
      <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-500 text-left">
        <p className="font-semibold text-slate-700 mb-1">Developer Diagnostic Note:</p>
        <p>If testing with <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">VITE_USE_MOCK_DATA=false</code>, ensure Manav's FastAPI backend is running on port 8000, or switch back to mock mode in <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">.env</code>.</p>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Retry Connection
        </button>
      )}
    </div>
  );
};

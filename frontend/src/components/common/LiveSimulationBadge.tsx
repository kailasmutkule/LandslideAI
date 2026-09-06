import React from 'react';
import { dataService } from '../../services/dataService';

export const LiveSimulationBadge: React.FC<{ className?: string }> = ({ className = '' }) => {
  // If running against real backend, hide automatically per Section 5 instructions
  if (!dataService.isMockSimulationActive()) {
    return null;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200/80 px-2.5 py-0.5 text-xs font-medium text-blue-700 shadow-xs ${className}`}
      title="Values gently update every 20-30s in prototype mode. Disappears when connected to live backend."
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
      </span>
      Live data simulation
    </span>
  );
};

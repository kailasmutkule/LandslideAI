/**
 * LANDSLIDE AI - Master Data Service Layer
 * 
 * THE RULE THAT MATTERS MOST (Architectural Boundary):
 * Every UI component imports strictly from this dataService module.
 * 
 * Switching between the real FastAPI backend and the realistic local mock
 * is controlled exclusively by the environment variable VITE_USE_MOCK_DATA.
 * 
 * When VITE_USE_MOCK_DATA is 'true' (or unset in dev), mockApi handles requests.
 * When VITE_USE_MOCK_DATA is 'false', real HTTP fetch calls are dispatched via api.ts.
 */

import { api } from './api';
import { mockApi } from './mockApi';

const useMock = import.meta.env.VITE_USE_MOCK_DATA !== 'false';

if (typeof window !== 'undefined') {
  console.info(
    `%c[LANDSLIDE AI DATA LAYER] Running in ${useMock ? 'SIMULATED MOCK' : 'LIVE API'} mode. (VITE_USE_MOCK_DATA=${import.meta.env.VITE_USE_MOCK_DATA})`,
    `background: ${useMock ? '#0284c7' : '#10b981'}; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;`
  );
}

// Re-export the selected active implementation
export const dataService = useMock ? mockApi : api;

// Direct type exports for convenience
export type {
  LocationFilters,
  AlertFilters,
  SensorFilters,
  HistoricalFilters
} from './api';

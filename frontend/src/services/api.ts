/**
 * LANDSLIDE AI - Real API Service Client
 * Direct typed fetch calls to FastAPI Backend (SIH26001).
 * NOTE: Both api.ts and mockApi.ts adhere to the exact same contract.
 */
import type {
  RiskLocation,
  Alert,
  SensorItem,
  TimeSeriesDataPoint,
  HistoricalLandslideRecord,
  HistoricalYearSummary,
  SystemHealth,
  PredictionRequest,
  PredictionResult,
  ReportType,
  GeneratedReport,
  LoginCredentials,
  AuthUser
} from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

export interface LocationFilters {
  state?: string;
  district?: string;
  minRisk?: number;
  riskLevel?: string;
}

export interface AlertFilters {
  severity?: string;
  locationId?: string;
}

export interface SensorFilters {
  type?: string;
  status?: string;
}

export interface HistoricalFilters {
  year?: number;
  state?: string;
  severity?: string;
}

export const api = {
  /**
   * Fetch list of monitored risk locations
   */
  async getLocations(filters?: LocationFilters): Promise<RiskLocation[]> {
    const params = new URLSearchParams();
    if (filters?.state && filters.state !== 'ALL') params.append('state', filters.state);
    if (filters?.district) params.append('district', filters.district);
    if (filters?.riskLevel && filters.riskLevel !== 'ALL') params.append('risk_level', filters.riskLevel);
    if (filters?.minRisk) params.append('min_risk', filters.minRisk.toString());

    const url = `${BASE_URL}/locations${params.toString() ? '?' + params.toString() : ''}`;
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error(`API error fetching locations: ${res.status} ${res.statusText}`);
    return res.json();
  },

  /**
   * Fetch single location by ID
   */
  async getLocationById(id: string): Promise<RiskLocation | null> {
    const res = await fetch(`${BASE_URL}/locations/${id}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`API error fetching location ${id}: ${res.status}`);
    return res.json();
  },

  /**
   * Fetch list of alerts
   */
  async getAlerts(filters?: AlertFilters): Promise<Alert[]> {
    const params = new URLSearchParams();
    if (filters?.severity && filters.severity !== 'ALL') params.append('severity', filters.severity);
    if (filters?.locationId) params.append('location_id', filters.locationId);

    const url = `${BASE_URL}/alerts${params.toString() ? '?' + params.toString() : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`API error fetching alerts: ${res.status}`);
    return res.json();
  },

  /**
   * Update alert status: Acknowledge, Escalate, or Dispatch Warning (CAP v1.2)
   */
  async updateAlertStatus(
    alertId: string,
    action: 'Acknowledge' | 'Escalate' | 'Dispatched',
    customMessage?: string
  ): Promise<Alert> {
    if (action === 'Dispatched') {
      const res = await fetch(`${BASE_URL}/alerts/dispatch-cap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alert_id: alertId,
          custom_message: customMessage || 'Immediate evacuation recommended. Slope destabilization detected.',
          operator_id: 'SDMA_DUTY_OFFICER_01'
        })
      });
      if (!res.ok) throw new Error(`Failed to dispatch alert: ${res.status}`);
      return res.json();
    }

    const res = await fetch(`${BASE_URL}/alerts/${alertId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    });
    if (!res.ok) throw new Error(`Failed to update alert: ${res.status}`);
    return res.json();
  },

  /**
   * Fetch monitoring sensors
   */
  async getSensors(filters?: SensorFilters): Promise<SensorItem[]> {
    const params = new URLSearchParams();
    if (filters?.type && filters.type !== 'ALL') params.append('type', filters.type);
    if (filters?.status && filters.status !== 'ALL') params.append('status', filters.status);

    const url = `${BASE_URL}/sensors${params.toString() ? '?' + params.toString() : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`API error fetching sensors: ${res.status}`);
    return res.json();
  },

  /**
   * Fetch environmental time series telemetry
   */
  async getEnvironmentalTimeSeries(
    locationId?: string,
    range: '24h' | '7d' | '30d' = '24h'
  ): Promise<TimeSeriesDataPoint[]> {
    const params = new URLSearchParams({ range });
    if (locationId) params.append('location_id', locationId);

    const res = await fetch(`${BASE_URL}/weather/timeseries?${params.toString()}`);
    if (!res.ok) throw new Error(`API error fetching environmental time series: ${res.status}`);
    return res.json();
  },

  /**
   * Fetch historical landslide events
   */
  async getHistoricalRecords(filters?: HistoricalFilters): Promise<HistoricalLandslideRecord[]> {
    const params = new URLSearchParams();
    if (filters?.year) params.append('year', filters.year.toString());
    if (filters?.state && filters.state !== 'ALL') params.append('state', filters.state);
    if (filters?.severity && filters.severity !== 'ALL') params.append('severity', filters.severity);

    const res = await fetch(`${BASE_URL}/reports/historical?${params.toString()}`);
    if (!res.ok) throw new Error(`API error fetching historical data: ${res.status}`);
    return res.json();
  },

  /**
   * Fetch multi-year summaries for trend analysis
   */
  async getHistoricalYearSummaries(): Promise<HistoricalYearSummary[]> {
    const res = await fetch(`${BASE_URL}/reports/historical-trends`);
    if (!res.ok) throw new Error(`API error fetching historical trends: ${res.status}`);
    return res.json();
  },

  /**
   * Fetch system health probe
   */
  async getSystemHealth(): Promise<SystemHealth> {
    const res = await fetch(`${BASE_URL}/health`);
    if (!res.ok) throw new Error(`System health probe failed: ${res.status}`);
    return res.json();
  },

  /**
   * Run custom what-if ML prediction
   */
  async runCustomPrediction(request: PredictionRequest): Promise<PredictionResult> {
    const res = await fetch(`${BASE_URL}/predictions/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
    if (!res.ok) throw new Error(`ML prediction inference failed: ${res.status}`);
    return res.json();
  },

  /**
   * Generate authoritative reports
   */
  async generateReport(type: ReportType, district?: string): Promise<GeneratedReport> {
    const res = await fetch(`${BASE_URL}/reports/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, district })
    });
    if (!res.ok) throw new Error(`Report generation failed: ${res.status}`);
    return res.json();
  },

  /**
   * Authenticate user (Demo / Real)
   */
  async login(credentials: LoginCredentials): Promise<AuthUser> {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    if (!res.ok) throw new Error(`Login failed: Invalid credentials`);
    return res.json();
  },

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    const stored = localStorage.getItem('landslide_user');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  },

  /**
   * No-op subscriber for real API (WebSockets would replace this)
   */
  subscribeLiveUpdates(_callback: () => void): () => void {
    return () => {};
  },

  isMockSimulationActive(): boolean {
    return false;
  }
};

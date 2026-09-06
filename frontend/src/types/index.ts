/**
 * LANDSLIDE AI - Core Type Definitions
 * Shared interfaces used by BOTH real API (api.ts) and mock service (mockApi.ts).
 * Aligned with SIH26001 FastAPI backend and ML inference schemas.
 */

// ==========================================
// 1. RISK LOCATION (Section 4 Core Contract)
// ==========================================
export interface PredictionTimelinePoint {
  time: string;   // e.g. "+6h", "+12h", "+24h", "+48h"
  label: string;  // e.g. "Today 20:00"
  score: number;  // 0-100
  rainfall: number; // mm forecast
  moisture: number; // %
}

export interface ExplainabilityFactor {
  factor: string;
  label: string;
  value: string;
  contribution_percentage: number;
  is_critical_driver: boolean;
}

export interface RiskLocation {
  id: string;
  location: string;
  state: string;
  latitude: number;
  longitude: number;
  riskScore: number;        // 0-100
  probability: number;      // 0-100
  confidence: number;       // 0-100
  rainfall24h: number;      // mm
  soilMoisture: number;     // %
  slope: number;            // degrees
  groundSaturation: number; // %
  vegetationLoss: number;   // %
  riskLevel: "Low" | "Moderate" | "High" | "Critical";
  lastUpdated: string;      // ISO timestamp

  // PROVISIONAL — confirm with backend team
  district?: string;
  elevation?: number;       // meters ASL
  trend?: "Rising" | "Stable" | "Falling";
  expectedWindow?: string;  // e.g. "3-6 Hours", "Immediate (<3h)"
  primaryTrigger?: string;  // e.g. "Torrential Rain (138mm/24h)"
  recommendedAction?: string;
  historicalIncidentsCount?: number;
  lastMajorIncident?: string;
  predictionTimeline?: PredictionTimelinePoint[];
  sopSteps?: string[];
  factors?: ExplainabilityFactor[];
}

// ==========================================
// 2. ALERTS (Section 4 Core Contract)
// ==========================================
export interface Alert {
  id: string;
  locationId: string;
  severity: "Critical" | "High" | "Moderate" | "Resolved";
  triggerReason: string;
  triggeredAt: string;
  recommendedAction: string;
  notificationStatus: "Pending" | "Dispatched" | "Acknowledged";

  // PROVISIONAL — confirm with backend team
  location?: string;
  state?: string;
  district?: string;
  probability?: number;
  riskScore?: number;
}

// ==========================================
// 3. SENSORS & TELEMETRY
// ==========================================
export type SensorType = 
  | "rain_gauge" 
  | "soil_moisture" 
  | "inclinometer" 
  | "weather_station" 
  | "piezometer" 
  | "insar_reflector";

export type SensorStatus = "online" | "warning" | "offline";

export interface SensorItem {
  id: string;
  name: string;
  location: string;
  state: string;
  type: SensorType;
  status: SensorStatus;
  battery: number;          // %
  lastReading: string;      // human readable or ISO
  signalQuality: string;    // e.g. "Strong 4G", "SatCom"
  solarCharging: boolean;
  latitude: number;
  longitude: number;
  firmwareVersion?: string;
}

// ==========================================
// 4. ENVIRONMENTAL TIME SERIES
// ==========================================
export interface TimeSeriesDataPoint {
  timestamp: string;
  timeLabel: string;
  rainfall: number;         // mm
  soilMoisture: number;     // %
  groundSaturation: number; // %
  temperature: number;      // °C
}

// ==========================================
// 5. HISTORICAL RECORDS & INSIGHTS
// ==========================================
export interface HistoricalLandslideRecord {
  id: string;
  year: number;
  month: string;
  state: string;
  district: string;
  location: string;
  fatalities: number;
  roadBlocked: string;
  rainfallMm: number;
  severity: "Critical" | "High" | "Moderate" | "Low";
  trigger: string;
}

export interface HistoricalYearSummary {
  year: number;
  incidents: number;
  criticalEvents: number;
  avgRainfall: number;
  modelAccuracy: number;
}

// ==========================================
// 6. SYSTEM HEALTH TELEMETRY
// ==========================================
export interface SystemHealth {
  status: "OPERATIONAL" | "DEGRADED" | "OFFLINE";
  service: string;
  version: string;
  environment?: string;
  subsystems: {
    ai_inference_engine: string;
    hydrometeorological_pipeline: string;
    cap_alert_relay: string;
    field_report_sync: string;
    geospatial_engine: string;
  };
  monitored_region: string;
  active_corridors: string[];
}

// ==========================================
// 7. AI PREDICTION SIMULATOR (WHAT-IF)
// ==========================================
export interface PredictionRequest {
  location_name?: string;
  latitude: number;
  longitude: number;
  slope: number;
  rainfall_24h: number;
  soil_moisture: number;
  ground_water_saturation?: number;
  vegetation_loss?: number;
  elevation?: number;
}

export interface PredictionResult {
  location_name: string;
  latitude: number;
  longitude: number;
  risk_score: number;
  probability: number;
  confidence: number;
  risk_level: "Low" | "Moderate" | "High" | "Critical";
  expected_window: string;
  primary_trigger: string;
  plain_language_reasoning: string;
  recommended_sop: string;
  factors: ExplainabilityFactor[];
  prediction_trajectory: PredictionTimelinePoint[];
}

// ==========================================
// 8. REPORTS
// ==========================================
export type ReportType = "Daily" | "Weekly" | "Critical" | "District" | "AI-Performance";

export interface GeneratedReport {
  id: string;
  type: ReportType;
  title: string;
  generatedAt: string;
  scope: string;
  summary: string;
  keyMetrics: {
    criticalAlertsCount: number;
    activeHotspotsCount: number;
    highestRiskLocation: string;
    avgRainfallMm: number;
    aiModelAccuracy: string;
  };
  highRiskLocations: string[];
  recommendedDirectives: string[];
}

// ==========================================
// 9. AUTHENTICATION (DEMO/PROVISIONAL)
// ==========================================
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "SDMA_OFFICER" | "DISTRICT_COLLECTOR" | "NDRF_COMMANDER" | "ANALYST";
  jurisdiction: string;
  token?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

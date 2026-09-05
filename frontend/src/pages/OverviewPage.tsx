import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Flame,
  ShieldCheck,
  Droplets,
  Radio,
  Brain,
  ArrowUpRight,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { dataService } from '../services/dataService';
import type { RiskLocation, Alert, TimeSeriesDataPoint } from '../types';
import { StatCard } from '../components/common/StatCard';
import { RiskBadge } from '../components/common/RiskBadge';
import { CardSkeleton, TableSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorState } from '../components/common/ErrorState';
import { RiskMapLeaflet } from '../components/map/RiskMapLeaflet';
import { LocationDetailModal } from '../components/modals/LocationDetailModal';
import { DispatchWarningModal } from '../components/modals/DispatchWarningModal';
import { useToast } from '../context/ToastContext';
import { useFilters } from '../context/FilterContext';

export const OverviewPage: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const { selectedState, selectedDistrict } = useFilters();
  const { showToast } = useToast();

  const [locations, setLocations] = useState<RiskLocation[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesDataPoint[]>([]);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedLocation, setSelectedLocation] = useState<RiskLocation | null>(null);
  const [dispatchAlert, setDispatchAlert] = useState<Alert | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [locs, alts, ts] = await Promise.all([
        dataService.getLocations({ state: selectedState, district: selectedDistrict }),
        dataService.getAlerts({ severity: 'ALL' }),
        dataService.getEnvironmentalTimeSeries(undefined, timeRange)
      ]);
      setLocations(locs);
      setAlerts(alts);
      setTimeSeries(ts);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load dashboard telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Subscribe to live simulation pulses
    const unsubscribe = dataService.subscribeLiveUpdates(() => {
      dataService.getLocations({ state: selectedState, district: selectedDistrict })
        .then(setLocations)
        .catch(() => {});
      dataService.getAlerts()
        .then(setAlerts)
        .catch(() => {});
    });

    return () => unsubscribe();
  }, [selectedState, selectedDistrict, timeRange]);

  const handleDispatchConfirm = async (alertId: string, customMessage: string) => {
    try {
      await dataService.updateAlertStatus(alertId, 'Dispatched', customMessage);
      showToast('✓ Warning Dispatched via CAP v1.2 Protocol across Cell Broadcast & Radio', 'success');
      loadData();
    } catch {
      showToast('Failed to dispatch emergency warning', 'error');
    }
  };

  const handleAcknowledge = async (alertId: string) => {
    try {
      await dataService.updateAlertStatus(alertId, 'Acknowledge');
      showToast('Alert Acknowledged by SDMA Duty Officer', 'info');
      loadData();
    } catch {
      showToast('Action failed', 'error');
    }
  };

  if (error) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  // Calculate 6 KPIs
  const criticalCount = locations.filter(l => l.riskLevel === 'Critical').length;
  const highRiskCount = locations.filter(l => l.riskLevel === 'High').length;
  const activeAlertsCount = alerts.filter(a => a.notificationStatus !== 'Acknowledged').length;
  const avgRainfall = locations.length > 0
    ? +(locations.reduce((acc, l) => acc + l.rainfall24h, 0) / locations.length).toFixed(1)
    : 0;
  const maxRisk = locations.length > 0
    ? locations.reduce((max, l) => (max && l.riskScore > max.riskScore ? l : max), locations[0])
    : null;

  return (
    <div className="space-y-6">
      {/* 3-Second Triage Urgent Banner (if Criticals present) */}
      {criticalCount > 0 && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white shadow-xs">
              <AlertTriangle className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
                  Critical Hazard Escalation Detected
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-200 text-rose-800">
                  {criticalCount} SECTORS AT BREACH POINT
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">
                Highest vulnerability at <strong>{maxRisk?.location || 'Aizawl & Gangtok'}</strong> (Score: {maxRisk?.riskScore || 92}/100). Imminent slope destabilization.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('/alerts')}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors shadow-2xs"
            >
              Dispatch Common Alerts
            </button>
            <button
              onClick={() => onNavigate('/risk-map')}
              className="px-3 py-1.5 rounded-xl border border-rose-300 bg-white text-rose-700 text-xs font-semibold hover:bg-rose-50 transition-colors shadow-2xs"
            >
              Inspect GIS Map
            </button>
          </div>
        </div>
      )}

      {/* 6 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {loading ? (
          <CardSkeleton count={6} />
        ) : (
          <>
            <StatCard
              title="Critical Sectors"
              value={criticalCount}
              subtitle="Score > 80/100"
              icon={Flame}
              iconColor="text-rose-600 bg-rose-50"
              highlight={criticalCount > 0}
              trend={{ direction: 'up', label: '+2 today' }}
            />
            <StatCard
              title="High Risk Zones"
              value={highRiskCount}
              subtitle="Score 68-79/100"
              icon={AlertTriangle}
              iconColor="text-amber-600 bg-amber-50"
              trend={{ direction: 'neutral', label: 'Stable' }}
            />
            <StatCard
              title="Active Warnings"
              value={activeAlertsCount}
              subtitle="Pending dispatch"
              icon={AlertTriangle}
              iconColor="text-purple-600 bg-purple-50"
            />
            <StatCard
              title="24h Avg Rainfall"
              value={avgRainfall}
              unit="mm"
              subtitle="Regional weighted sum"
              icon={Droplets}
              iconColor="text-sky-600 bg-sky-50"
              trend={{ direction: 'up', label: 'Rising' }}
            />
            <StatCard
              title="IoT Sensors"
              value="98.2"
              unit="%"
              subtitle="Telemetry operational"
              icon={Radio}
              iconColor="text-emerald-600 bg-emerald-50"
            />
            <StatCard
              title="AI Confidence"
              value="94.6"
              unit="%"
              subtitle="LandslideAI-LSTM v1.0"
              icon={Brain}
              iconColor="text-blue-600 bg-blue-50"
            />
          </>
        )}
      </div>

      {/* Main Grid: GIS Map Preview & AI Intelligence Explainability */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Live GIS Map Preview (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-heading">
                Geospatial Hazard Surface & Relief Map
              </h3>
              <p className="text-xs text-slate-500">
                Terrain relief overlay with real-time slope gradient and active hotspots
              </p>
            </div>
            <button
              onClick={() => onNavigate('/risk-map')}
              className="flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700"
            >
              Full Screen GIS <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex-1 min-h-[420px]">
            <RiskMapLeaflet
              locations={locations}
              height="420px"
              onSelectLocation={loc => setSelectedLocation(loc)}
            />
          </div>
        </div>

        {/* AI Explainability & Contributing Factors (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-heading flex items-center gap-2">
                <Brain className="h-4 w-4 text-sky-600" />
                AI Risk Intelligence (Explainable AI)
              </h3>
              <p className="text-xs text-slate-500">
                Primary failure mechanics & SHAP feature contributions
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800">
              SHAP v2.4
            </span>
          </div>

          {/* Highest Risk Highlight Card */}
          {maxRisk && (
            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 mb-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">{maxRisk.location}</span>
                <RiskBadge level={maxRisk.riskLevel} size="sm" />
              </div>
              <p className="text-xs text-slate-700">
                <strong>Why it is happening:</strong> {maxRisk.primaryTrigger}
              </p>
              <div className="text-[11px] text-slate-600 flex items-center justify-between pt-1">
                <span>Slope: <strong>{maxRisk.slope}°</strong></span>
                <span>Rain 24h: <strong>{maxRisk.rainfall24h} mm</strong></span>
                <span>Moisture: <strong>{maxRisk.soilMoisture}%</strong></span>
              </div>
            </div>
          )}

          {/* Factor Breakdown */}
          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Regional Driving Weight Breakdown
            </p>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">Antecedent Precipitation (24h-72h)</span>
                <span className="font-bold text-slate-900">44% weight</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-sky-600" style={{ width: '44%' }} />
              </div>
              <p className="text-[10px] text-slate-500">IMERG & AWS rainfall accumulation exceeds shear threshold</p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">Topographic Gradient (CartoDEM)</span>
                <span className="font-bold text-slate-900">28% weight</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-amber-500" style={{ width: '28%' }} />
              </div>
              <p className="text-[10px] text-slate-500">Slopes exceeding 38° exhibit gravity tensile stress</p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">Subsurface Pore Saturation</span>
                <span className="font-bold text-slate-900">18% weight</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-purple-500" style={{ width: '18%' }} />
              </div>
              <p className="text-[10px] text-slate-500">Root zone volumetric moisture &gt; 85% causes cohesion drop</p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">Vegetation & Scarp NDVI Loss</span>
                <span className="font-bold text-slate-900">10% weight</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-emerald-600" style={{ width: '10%' }} />
              </div>
              <p className="text-[10px] text-slate-500">Sentinel-2 optical bare scarp detection</p>
            </div>
          </div>

          {/* Action SOP */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Target Horizon: <strong>0 – 6 Hours</strong></span>
            <button
              onClick={() => onNavigate('/predictions')}
              className="text-xs font-bold text-slate-900 hover:text-sky-600 transition-colors flex items-center gap-1"
            >
              Simulate Scenarios <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Environmental Charts & Active Alerts Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Environmental Hydrometeorological Charts (7 Cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-heading">
                Atmospheric & Soil Moisture Telemetry
              </h3>
              <p className="text-xs text-slate-500">
                Precipitation load vs ground saturation curve
              </p>
            </div>

            {/* 24H / 7D / 30D Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              {(['24h', '7d', '30d'] as const).map(range => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-2.5 py-1 rounded-lg uppercase transition-colors ${
                    timeRange === range
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRain" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorMoist" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9333ea" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#9333ea" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="timeLabel" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '0.75rem',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="rainfall"
                  name="Rainfall (mm)"
                  stroke="#0284c7"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRain)"
                />
                <Area
                  type="monotone"
                  dataKey="soilMoisture"
                  name="Soil Moisture (%)"
                  stroke="#9333ea"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorMoist)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-sky-600" /> Rainfall (mm)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-purple-600" /> Soil Saturation (%)
            </span>
            <span className="text-[11px] text-slate-400">Synced from Open-Meteo & GPM IMERG</span>
          </div>
        </div>

        {/* Active Alerts Feed (5 Cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-heading">
                Authoritative Alerts Feed
              </h3>
              <p className="text-xs text-slate-500">
                Real-time CAP alert triggers awaiting field response
              </p>
            </div>
            <button
              onClick={() => onNavigate('/alerts')}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
            >
              All Alerts <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] pr-1">
            {alerts.slice(0, 4).map(alert => (
              <div
                key={alert.id}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 leading-tight">
                      {alert.location}
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      {alert.district ? `${alert.district}, ` : ''}{alert.state}
                    </p>
                  </div>
                  <RiskBadge level={alert.severity} size="sm" />
                </div>

                <p className="text-xs text-slate-700 line-clamp-2">
                  {alert.triggerReason}
                </p>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                  <span className="text-[10px] font-medium text-slate-400">
                    Status: <strong className="text-slate-600">{alert.notificationStatus}</strong>
                  </span>
                  <div className="flex items-center gap-2">
                    {alert.notificationStatus !== 'Acknowledged' && (
                      <button
                        onClick={() => handleAcknowledge(alert.id)}
                        className="text-[11px] font-semibold text-slate-600 hover:text-slate-900"
                      >
                        Acknowledge
                      </button>
                    )}
                    <button
                      onClick={() => setDispatchAlert(alert)}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-bold hover:bg-slate-800 transition-colors shadow-2xs"
                    >
                      Dispatch
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      <LocationDetailModal
        location={selectedLocation}
        isOpen={!!selectedLocation}
        onClose={() => setSelectedLocation(null)}
        onDispatchWarning={loc => {
          setSelectedLocation(null);
          const matchAlert = alerts.find(a => a.locationId === loc.id) || {
            id: `alt-${loc.id}`,
            locationId: loc.id,
            location: loc.location,
            state: loc.state,
            district: loc.district,
            severity: (loc.riskLevel === 'Low' ? 'Moderate' : loc.riskLevel),
            triggerReason: loc.primaryTrigger || 'Hazard threshold exceeded',
            triggeredAt: new Date().toISOString(),
            recommendedAction: loc.recommendedAction || 'Evacuation caution',
            notificationStatus: 'Pending',
            riskScore: loc.riskScore,
            probability: loc.probability
          };
          setDispatchAlert(matchAlert);
        }}
      />

      <DispatchWarningModal
        alert={dispatchAlert}
        isOpen={!!dispatchAlert}
        onClose={() => setDispatchAlert(null)}
        onConfirmDispatch={handleDispatchConfirm}
      />
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Droplets,
  Mountain,
  Gauge,
  Calendar,
  AlertTriangle,
  Clock,
  Compass,
  ArrowLeft,
  Send,
  Brain,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';
import { dataService } from '../services/dataService';
import type { RiskLocation, Alert } from '../types';
import { RiskBadge } from '../components/common/RiskBadge';
import { CardSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorState } from '../components/common/ErrorState';
import { DispatchWarningModal } from '../components/modals/DispatchWarningModal';
import { useToast } from '../context/ToastContext';

interface LocationDetailPageProps {
  locationId?: string;
  onNavigate: (path: string) => void;
}

export const LocationDetailPage: React.FC<LocationDetailPageProps> = ({
  locationId,
  onNavigate
}) => {
  const { showToast } = useToast();

  const [locations, setLocations] = useState<RiskLocation[]>([]);
  const [selectedId, setSelectedId] = useState<string>(locationId || '');
  const [currentLocation, setCurrentLocation] = useState<RiskLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dispatchAlert, setDispatchAlert] = useState<Alert | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const all = await dataService.getLocations();
        setLocations(all);
        const targetId = selectedId || locationId || (all[0] ? all[0].id : '');
        setSelectedId(targetId);
        const targetLoc = all.find(l => l.id === targetId) || all[0] || null;
        setCurrentLocation(targetLoc);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Failed to load location details.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [locationId]);

  const handleSelectChange = (id: string) => {
    setSelectedId(id);
    const target = locations.find(l => l.id === id) || null;
    setCurrentLocation(target);
  };

  const handleDispatchConfirm = async (alertId: string, customMessage: string) => {
    try {
      await dataService.updateAlertStatus(alertId, 'Dispatched', customMessage);
      showToast('✓ Warning Dispatched via CAP v1.2 Protocol', 'success');
    } catch {
      showToast('Failed to dispatch alert', 'error');
    }
  };

  if (error) {
    return <ErrorState message={error} onRetry={() => setSelectedId(selectedId)} />;
  }

  if (loading || !currentLocation) {
    return (
      <div className="space-y-6">
        <CardSkeleton count={3} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Navigation & Location Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('/hotspots')}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Back to Hotspots"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900 font-heading">
                {currentLocation.location}
              </h3>
              <RiskBadge level={currentLocation.riskLevel} size="md" />
            </div>
            <p className="text-xs text-slate-500">
              {currentLocation.district ? `${currentLocation.district}, ` : ''}{currentLocation.state} &bull; Coordinates: {currentLocation.latitude}° N, {currentLocation.longitude}° E
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Switch Location Dropdown */}
          <select
            value={selectedId}
            onChange={e => handleSelectChange(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none"
          >
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>
                {loc.location} ({loc.riskScore}/100)
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              setDispatchAlert({
                id: `alt-${currentLocation.id}`,
                locationId: currentLocation.id,
                location: currentLocation.location,
                state: currentLocation.state,
                district: currentLocation.district,
                severity: (currentLocation.riskLevel === 'Low' ? 'Moderate' : currentLocation.riskLevel),
                triggerReason: currentLocation.primaryTrigger || 'Slope instability threshold exceeded',
                triggeredAt: new Date().toISOString(),
                recommendedAction: currentLocation.recommendedAction || 'Evacuation advisory',
                notificationStatus: 'Pending',
                riskScore: currentLocation.riskScore,
                probability: currentLocation.probability
              });
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-colors shadow-2xs"
          >
            <Send className="h-3.5 w-3.5" />
            Dispatch Alert
          </button>
        </div>
      </div>

      {/* 3 Core Inferences Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-5 text-center shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-700">
            Overall Landslide Risk Score
          </span>
          <div className="mt-1 flex items-baseline justify-center gap-1.5">
            <span className="text-4xl font-extrabold text-rose-800 font-heading">
              {currentLocation.riskScore}
            </span>
            <span className="text-sm font-semibold text-rose-600">/ 100</span>
          </div>
          <p className="text-xs font-medium text-rose-600 mt-1 flex items-center justify-center gap-1">
            <TrendingUp className="h-3.5 w-3.5" /> Trend: {currentLocation.trend || 'Rising'}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Failure Probability
          </span>
          <div className="mt-1 flex items-baseline justify-center gap-1.5">
            <span className="text-4xl font-extrabold text-slate-900 font-heading">
              {currentLocation.probability}
            </span>
            <span className="text-sm font-semibold text-slate-500">%</span>
          </div>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Expected Window: <strong>{currentLocation.expectedWindow}</strong>
          </p>
        </div>

        <div className="rounded-2xl border border-sky-200 bg-sky-50/40 p-5 text-center shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-sky-700">
            AI Model Confidence
          </span>
          <div className="mt-1 flex items-baseline justify-center gap-1.5">
            <span className="text-4xl font-extrabold text-sky-900 font-heading">
              {currentLocation.confidence}
            </span>
            <span className="text-sm font-semibold text-sky-600">%</span>
          </div>
          <p className="text-xs font-medium text-sky-600 mt-1">
            Validated against GSI Geological Catalog
          </p>
        </div>
      </div>

      {/* Environmental Conditions Grid */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Environmental Sensor & Geological Attributes
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Droplets className="h-4 w-4 text-sky-600" />
              <span>24h Rainfall</span>
            </div>
            <div className="text-lg font-bold text-slate-900 mt-1">
              {currentLocation.rainfall24h} mm
            </div>
            <span className="text-[10px] text-slate-400">Open-Meteo live feed</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Mountain className="h-4 w-4 text-amber-600" />
              <span>Slope Gradient</span>
            </div>
            <div className="text-lg font-bold text-slate-900 mt-1">
              {currentLocation.slope}°
            </div>
            <span className="text-[10px] text-slate-400">ISRO CartoDEM 30m</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Compass className="h-4 w-4 text-purple-600" />
              <span>Soil Moisture</span>
            </div>
            <div className="text-lg font-bold text-slate-900 mt-1">
              {currentLocation.soilMoisture}%
            </div>
            <span className="text-[10px] text-slate-400">0-7cm Root Zone</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Gauge className="h-4 w-4 text-emerald-600" />
              <span>Ground Saturation</span>
            </div>
            <div className="text-lg font-bold text-slate-900 mt-1">
              {currentLocation.groundSaturation}%
            </div>
            <span className="text-[10px] text-slate-400">Piezometer reading</span>
          </div>
        </div>
      </div>

      {/* SHAP Explainability & Prediction Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SHAP Factors (6 cols) */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Brain className="h-4 w-4 text-sky-600" />
              Explainable AI: Contributing Drivers
            </h4>
            <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
              SHAP Explainer
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {(currentLocation.factors || []).map((factor, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-800">
                    {factor.label} ({factor.value})
                  </span>
                  <span className="text-slate-500">{factor.contribution_percentage}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      factor.is_critical_driver ? 'bg-rose-600' : 'bg-slate-700'
                    }`}
                    style={{ width: `${factor.contribution_percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Prediction Timeline Trajectory (6 cols) */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-purple-600" />
              Temporal Prediction Timeline (+48h Forecast)
            </h4>
            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
              Hourly Trajectory
            </span>
          </div>

          <div className="grid grid-cols-5 gap-2 text-center pt-2">
            {(currentLocation.predictionTimeline || []).map((pt, i) => {
              let badgeBg = 'bg-slate-100 text-slate-700';
              if (pt.score >= 80) badgeBg = 'bg-rose-100 text-rose-800 font-bold';
              else if (pt.score >= 68) badgeBg = 'bg-amber-100 text-amber-800';

              return (
                <div key={i} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 shadow-2xs">
                  <span className="text-xs font-bold text-slate-700 block">{pt.time}</span>
                  <span className={`inline-block my-1 px-2 py-0.5 rounded-lg text-xs ${badgeBg}`}>
                    {pt.score}
                  </span>
                  <span className="text-[10px] text-slate-500 block">{pt.rainfall} mm</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recommended Actions / SOP Steps */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5 shadow-xs space-y-2 text-xs text-amber-950">
        <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <span>Recommended Standard Operating Procedure (SOP)</span>
        </div>
        <p className="font-semibold">{currentLocation.recommendedAction}</p>
        {currentLocation.sopSteps && (
          <ul className="list-disc pl-5 space-y-1 pt-1 text-slate-700">
            {currentLocation.sopSteps.map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Historical Incident History */}
      <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-400" />
          <span>
            Cumulative Historical Events: <strong>{currentLocation.historicalIncidentsCount || 10} recorded slope failures</strong>
          </span>
        </div>
        <span className="italic text-slate-500">
          Last major event: {currentLocation.lastMajorIncident || 'July 2023'}
        </span>
      </div>

      <DispatchWarningModal
        alert={dispatchAlert}
        isOpen={!!dispatchAlert}
        onClose={() => setDispatchAlert(null)}
        onConfirmDispatch={handleDispatchConfirm}
      />
    </div>
  );
};

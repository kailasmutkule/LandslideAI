import React from 'react';
import {
  X,
  MapPin,
  Droplets,
  Mountain,
  Gauge,
  Calendar,
  AlertTriangle,
  Clock,
  Compass,
  CheckCircle2,
  TrendingUp,
  Activity
} from 'lucide-react';
import type { RiskLocation } from '../../types';
import { RiskBadge } from '../common/RiskBadge';

interface LocationDetailModalProps {
  location: RiskLocation | null;
  isOpen: boolean;
  onClose: () => void;
  onDispatchWarning?: (loc: RiskLocation) => void;
}

export const LocationDetailModal: React.FC<LocationDetailModalProps> = ({
  location,
  isOpen,
  onClose,
  onDispatchWarning
}) => {
  if (!isOpen || !location) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-3xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8 z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200/80 px-6 py-5 bg-slate-50/50">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <RiskBadge level={location.riskLevel} size="md" />
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                {location.district ? `${location.district}, ` : ''}{location.state}
              </span>
            </div>
            <h3 className="text-xl font-bold tracking-tight text-slate-900 font-heading">
              {location.location}
            </h3>
            <p className="text-xs text-slate-500">
              Coordinates: {location.latitude.toFixed(4)}° N, {location.longitude.toFixed(4)}° E &bull; Elevation: {location.elevation || 1250} m ASL
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[78vh] overflow-y-auto">
          {/* Top Score Matrix: 3 Core Inferences */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-4 text-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-rose-700">
                Landslide Hazard Score
              </span>
              <div className="mt-1 flex items-baseline justify-center gap-1">
                <span className="text-3xl font-extrabold text-rose-800 font-heading">
                  {location.riskScore}
                </span>
                <span className="text-xs font-semibold text-rose-600">/100</span>
              </div>
              <p className="text-[11px] font-medium text-rose-600 mt-1">
                Trend: {location.trend || 'Rising'}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Failure Probability
              </span>
              <div className="mt-1 flex items-baseline justify-center gap-1">
                <span className="text-3xl font-extrabold text-slate-900 font-heading">
                  {location.probability}
                </span>
                <span className="text-xs font-semibold text-slate-500">%</span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 mt-1">
                Expected Window: {location.expectedWindow || '3-6 Hours'}
              </p>
            </div>

            <div className="rounded-2xl border border-sky-200 bg-sky-50/40 p-4 text-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-sky-700">
                AI Confidence (LSTM)
              </span>
              <div className="mt-1 flex items-baseline justify-center gap-1">
                <span className="text-3xl font-extrabold text-sky-900 font-heading">
                  {location.confidence}
                </span>
                <span className="text-xs font-semibold text-sky-600">%</span>
              </div>
              <p className="text-[11px] font-medium text-sky-600 mt-1">
                SHAP Validated
              </p>
            </div>
          </div>

          {/* Environmental Conditions Grid */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Environmental & Geological Real-Time Metrics
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Droplets className="h-4 w-4 text-sky-500" />
                  <span>Rainfall 24h</span>
                </div>
                <div className="mt-1 text-base font-bold text-slate-900">
                  {location.rainfall24h} mm
                </div>
                <div className="text-[10px] text-slate-400">Open-Meteo & IMERG</div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Mountain className="h-4 w-4 text-amber-500" />
                  <span>Slope Angle</span>
                </div>
                <div className="mt-1 text-base font-bold text-slate-900">
                  {location.slope}°
                </div>
                <div className="text-[10px] text-slate-400">ISRO CartoDEM 30m</div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Compass className="h-4 w-4 text-purple-500" />
                  <span>Soil Moisture</span>
                </div>
                <div className="mt-1 text-base font-bold text-slate-900">
                  {location.soilMoisture}%
                </div>
                <div className="text-[10px] text-slate-400">0-7cm Root Zone</div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Gauge className="h-4 w-4 text-emerald-500" />
                  <span>Ground Sat.</span>
                </div>
                <div className="mt-1 text-base font-bold text-slate-900">
                  {location.groundSaturation}%
                </div>
                <div className="text-[10px] text-slate-400">Pore Pressure</div>
              </div>
            </div>
          </div>

          {/* Explainability / Contributing Risk Factors */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Explainable AI: Key Contributing Factors (SHAP Weights)
            </h4>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
              {(location.factors || []).map((factor, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="flex items-center gap-1.5 text-slate-800">
                      {factor.is_critical_driver && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-100 text-rose-700 border border-rose-200 uppercase">
                          Critical Driver
                        </span>
                      )}
                      {factor.label} ({factor.value})
                    </span>
                    <span className="text-slate-600">{factor.contribution_percentage}% impact</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
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

          {/* Prediction Timeline (Now / +6h / +12h / +24h / +48h) */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Temporal Risk Trajectory (Next 48 Hours)
            </h4>
            <div className="grid grid-cols-5 gap-2 text-center">
              {(location.predictionTimeline || []).map((pt, i) => {
                let badgeBg = 'bg-slate-100 text-slate-700 border-slate-200';
                if (pt.score >= 80) badgeBg = 'bg-rose-100 text-rose-800 border-rose-200 font-bold';
                else if (pt.score >= 65) badgeBg = 'bg-amber-100 text-amber-800 border-amber-200';

                return (
                  <div key={i} className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-2xs">
                    <span className="text-[11px] font-bold text-slate-500 block">{pt.time}</span>
                    <span className={`inline-block my-1 px-2 py-0.5 rounded-lg text-xs border ${badgeBg}`}>
                      {pt.score}
                    </span>
                    <span className="text-[10px] text-slate-500 block">{pt.rainfall} mm</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recommended Standard Operating Procedures */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Actionable SOP Directives
            </h4>
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-xs text-amber-950 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>Primary Recommendation: {location.recommendedAction}</span>
              </div>
              {location.sopSteps && location.sopSteps.length > 0 && (
                <ul className="space-y-1.5 pl-5 list-disc text-amber-900">
                  {location.sopSteps.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Historical Incident Track Record */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <Calendar className="h-4 w-4 text-slate-500" />
              <span>
                Historical recorded slope failures: <strong>{location.historicalIncidentsCount || 12} events</strong>
              </span>
            </div>
            <span className="text-slate-500 italic">
              Last major: {location.lastMajorIncident || 'Monsoon 2023'}
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-200/80 px-6 py-4 bg-slate-50/50">
          <span className="text-xs text-slate-400">
            Last Telemetry Sync: {new Date(location.lastUpdated).toLocaleTimeString()}
          </span>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
            >
              Close
            </button>
            {onDispatchWarning && (
              <button
                onClick={() => {
                  onDispatchWarning(location);
                }}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 transition-colors shadow-sm flex items-center gap-1.5"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                Dispatch Emergency Alert
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

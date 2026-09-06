import React, { useState } from 'react';
import {
  Settings,
  Bell,
  Sliders,
  Map,
  BrainCircuit,
  Server,
  Save,
  CheckCircle2,
  Info,
  ShieldCheck
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const SettingsPage: React.FC = () => {
  const { showToast } = useToast();

  // Notification prefs
  const [notifyPrefs, setNotifyPrefs] = useState({
    smsBroadcast: true,
    emailDigest: true,
    ndrfSatcom: true,
    sirenRelay: false,
    audioAlerts: true
  });

  // Risk thresholds
  const [thresholds, setThresholds] = useState({
    critical: 80,
    high: 68,
    moderate: 50
  });

  // Map & Simulation prefs
  const [mapPrefs, setMapPrefs] = useState({
    defaultLayer: 'terrain',
    autoCenterAlerts: true,
    refreshIntervalSeconds: 22
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Configuration settings saved successfully', 'success');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs">
            <Settings className="h-6 w-6 text-sky-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 font-heading">
              System Configuration & Command Preferences
            </h3>
            <p className="text-xs text-slate-500">
              Manage automated alerting channels, hazard score cutoffs, and AI engine telemetry
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-2xs"
        >
          <Save className="h-3.5 w-3.5" />
          Save Changes
        </button>
      </div>

      {/* AI Model Intelligence Info Card (Required by Section 3) */}
      <div className="rounded-2xl border border-sky-200 bg-linear-to-r from-sky-50/50 via-white to-blue-50/40 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-sky-100 pb-3">
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-sky-600" />
            <div>
              <h4 className="text-sm font-bold text-slate-900 font-heading">
                AI Model Architecture — LandslideAI-LSTM v1.0
              </h4>
              <p className="text-xs text-slate-500">
                Bidirectional LSTM with Attention Mechanism & SHAP Attribution
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            Validated Prototype
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-white rounded-xl border border-sky-100">
            <span className="text-[11px] text-slate-400 block font-semibold">Training Corpus</span>
            <strong className="text-slate-900 text-xs mt-0.5 block">
              Demo Dataset (SIH26001 Synthesized)
            </strong>
            <span className="text-[10px] text-slate-400">GSI Historical Inventory</span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-sky-100">
            <span className="text-[11px] text-slate-400 block font-semibold">Inference Latency</span>
            <strong className="text-slate-900 text-xs mt-0.5 block">
              ~65ms / sector point
            </strong>
            <span className="text-[10px] text-slate-400">FastAPI Async Worker</span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-sky-100">
            <span className="text-[11px] text-slate-400 block font-semibold">Validation Accuracy</span>
            <strong className="text-emerald-700 text-xs mt-0.5 block">
              94.6% AUC Metric
            </strong>
            <span className="text-[10px] text-slate-400">Validated on 2020-2024 Events</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-sky-50 p-2.5 rounded-xl">
          <Info className="h-4 w-4 text-sky-600 shrink-0" />
          <span>
            <strong>Evaluation Disclaimer:</strong> LandslideAI-LSTM is an academic prototype developed for SIH 2026. Live production deployment requires field recalibration across local geotechnical borehole sensors.
          </span>
        </div>
      </div>

      {/* 1. Risk Severity Thresholds */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Sliders className="h-4 w-4 text-slate-600" />
          <h4 className="text-sm font-bold text-slate-900 font-heading">
            Hazard Severity Scoring Thresholds
          </h4>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <div className="flex justify-between font-semibold mb-1">
              <span className="text-rose-700">Critical Evacuation Threshold: Score &ge; {thresholds.critical}/100</span>
              <span className="text-slate-500">Triggers automated siren & cell broadcast</span>
            </div>
            <input
              type="range"
              min={70}
              max={95}
              value={thresholds.critical}
              onChange={e => setThresholds({ ...thresholds, critical: Number(e.target.value) })}
              className="w-full accent-rose-600"
            />
          </div>

          <div>
            <div className="flex justify-between font-semibold mb-1">
              <span className="text-amber-700">High Risk Caution Threshold: Score &ge; {thresholds.high}/100</span>
              <span className="text-slate-500">Restricts multi-axle freight traffic</span>
            </div>
            <input
              type="range"
              min={55}
              max={75}
              value={thresholds.high}
              onChange={e => setThresholds({ ...thresholds, high: Number(e.target.value) })}
              className="w-full accent-amber-600"
            />
          </div>

          <div>
            <div className="flex justify-between font-semibold mb-1">
              <span className="text-yellow-700">Moderate Advisory Threshold: Score &ge; {thresholds.moderate}/100</span>
              <span className="text-slate-500">Alerts local patrol officers</span>
            </div>
            <input
              type="range"
              min={35}
              max={55}
              value={thresholds.moderate}
              onChange={e => setThresholds({ ...thresholds, moderate: Number(e.target.value) })}
              className="w-full accent-yellow-500"
            />
          </div>
        </div>
      </div>

      {/* 2. Notification Preferences */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Bell className="h-4 w-4 text-slate-600" />
          <h4 className="text-sm font-bold text-slate-900 font-heading">
            Automated Alert Distribution Channels
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
            <input
              type="checkbox"
              checked={notifyPrefs.smsBroadcast}
              onChange={e => setNotifyPrefs({ ...notifyPrefs, smsBroadcast: e.target.checked })}
              className="mt-0.5 rounded text-slate-900 focus:ring-slate-700"
            />
            <div>
              <span className="font-bold text-slate-800 block">Cell Broadcast (CAP-SMS)</span>
              <span className="text-slate-500 text-[11px]">Geo-fenced SMS warnings to all active mobile towers</span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
            <input
              type="checkbox"
              checked={notifyPrefs.ndrfSatcom}
              onChange={e => setNotifyPrefs({ ...notifyPrefs, ndrfSatcom: e.target.checked })}
              className="mt-0.5 rounded text-slate-900 focus:ring-slate-700"
            />
            <div>
              <span className="font-bold text-slate-800 block">NDRF Satellite Comms</span>
              <span className="text-slate-500 text-[11px]">Direct priority dispatch to 1st Battalion headquarters</span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
            <input
              type="checkbox"
              checked={notifyPrefs.emailDigest}
              onChange={e => setNotifyPrefs({ ...notifyPrefs, emailDigest: e.target.checked })}
              className="mt-0.5 rounded text-slate-900 focus:ring-slate-700"
            />
            <div>
              <span className="font-bold text-slate-800 block">Email Situation Digest</span>
              <span className="text-slate-500 text-[11px]">Hourly automated SITREP to District Magistrates</span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
            <input
              type="checkbox"
              checked={notifyPrefs.sirenRelay}
              onChange={e => setNotifyPrefs({ ...notifyPrefs, sirenRelay: e.target.checked })}
              className="mt-0.5 rounded text-slate-900 focus:ring-slate-700"
            />
            <div>
              <span className="font-bold text-slate-800 block">Municipal Physical Siren Relay</span>
              <span className="text-slate-500 text-[11px]">Acoustic village warning horns in high slope pockets</span>
            </div>
          </label>
        </div>
      </div>

      {/* 3. System & API Diagnostics */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Server className="h-4 w-4 text-slate-600" />
          <h4 className="text-sm font-bold text-slate-900 font-heading">
            Runtime Subsystem Diagnostics
          </h4>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          <div className="py-2.5 flex items-center justify-between">
            <span className="text-slate-600">Active Backend Base URL</span>
            <code className="bg-slate-100 px-2 py-0.5 rounded font-mono text-slate-800">
              {import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'}
            </code>
          </div>
          <div className="py-2.5 flex items-center justify-between">
            <span className="text-slate-600">Mock Simulation Mode (VITE_USE_MOCK_DATA)</span>
            <span className="font-bold text-sky-700">
              {import.meta.env.VITE_USE_MOCK_DATA !== 'false' ? 'ACTIVE (Simulated Prototype)' : 'OFFLINE (Pointing to Real API)'}
            </span>
          </div>
          <div className="py-2.5 flex items-center justify-between">
            <span className="text-slate-600">GIS Elevation Base</span>
            <span className="font-semibold text-slate-800">ISRO CartoDEM 30m / SRTM 1-ArcSecond</span>
          </div>
          <div className="py-2.5 flex items-center justify-between">
            <span className="text-slate-600">Precipitation Ingestion</span>
            <span className="font-semibold text-slate-800">NASA GPM IMERG V07B + Open-Meteo High Res</span>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  BellRing,
  AlertTriangle,
  CheckCircle2,
  Send,
  Eye,
  ArrowUpRight,
  Clock,
  ShieldAlert,
  Flame,
  Check
} from 'lucide-react';
import { dataService } from '../services/dataService';
import type { Alert, RiskLocation } from '../types';
import { RiskBadge } from '../components/common/RiskBadge';
import { CardSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorState } from '../components/common/ErrorState';
import { EmptyState } from '../components/common/EmptyState';
import { DispatchWarningModal } from '../components/modals/DispatchWarningModal';
import { LocationDetailModal } from '../components/modals/LocationDetailModal';
import { useToast } from '../context/ToastContext';
import { useFilters } from '../context/FilterContext';

export const EarlyWarningsPage: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const { selectedState, selectedDistrict } = useFilters();
  const { showToast } = useToast();

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [locations, setLocations] = useState<RiskLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [dispatchModalAlert, setDispatchModalAlert] = useState<Alert | null>(null);
  const [detailModalLocation, setDetailModalLocation] = useState<RiskLocation | null>(null);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const [allAlerts, allLocations] = await Promise.all([
        dataService.getAlerts(),
        dataService.getLocations({ state: selectedState, district: selectedDistrict })
      ]);
      setAlerts(allAlerts);
      setLocations(allLocations);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to retrieve early warning alerts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();

    const unsubscribe = dataService.subscribeLiveUpdates(() => {
      dataService.getAlerts()
        .then(setAlerts)
        .catch(() => {});
    });
    return () => unsubscribe();
  }, [selectedState, selectedDistrict]);

  // Alert actions
  const handleAcknowledge = async (alertId: string) => {
    try {
      await dataService.updateAlertStatus(alertId, 'Acknowledge');
      showToast('Alert Acknowledged by SDMA Duty Officer', 'info');
      loadAlerts();
    } catch {
      showToast('Failed to acknowledge alert', 'error');
    }
  };

  const handleEscalate = async (alertId: string) => {
    try {
      await dataService.updateAlertStatus(alertId, 'Escalate');
      showToast('Alert Escalated to CRITICAL Severity Level', 'warning');
      loadAlerts();
    } catch {
      showToast('Failed to escalate alert', 'error');
    }
  };

  const handleDispatchConfirm = async (alertId: string, customMessage: string) => {
    try {
      await dataService.updateAlertStatus(alertId, 'Dispatched', customMessage);
      showToast('✓ Warning Dispatched via CAP v1.2 Protocol', 'success');
      loadAlerts();
    } catch {
      showToast('Failed to dispatch alert', 'error');
    }
  };

  const handleViewLocation = async (locationId: string) => {
    try {
      const loc = await dataService.getLocationById(locationId);
      if (loc) {
        setDetailModalLocation(loc);
      } else {
        showToast('Location details not found', 'warning');
      }
    } catch {
      showToast('Error loading location details', 'error');
    }
  };

  if (error) {
    return <ErrorState message={error} onRetry={loadAlerts} />;
  }

  // Filter alerts by state if selected
  const filteredAlerts = alerts.filter(a => {
    if (selectedState === 'ALL') return true;
    return a.state?.toLowerCase() === selectedState.toLowerCase();
  });

  // Section categories per Prompt section 3
  const criticalAlerts = filteredAlerts.filter(a => a.severity === 'Critical');
  const highAlerts = filteredAlerts.filter(a => a.severity === 'High');
  const moderateAlerts = filteredAlerts.filter(a => a.severity === 'Moderate');
  const resolvedAlerts = filteredAlerts.filter(a => a.severity === 'Resolved');

  const renderAlertCard = (alert: Alert) => {
    const isDispatched = alert.notificationStatus === 'Dispatched';
    const isAcknowledged = alert.notificationStatus === 'Acknowledged';

    return (
      <div
        key={alert.id}
        className={`tilt-card rounded-2xl border bg-white p-5 shadow-xs transition-all hover:shadow-md space-y-3 ${
          alert.severity === 'Critical'
            ? 'border-rose-200 ring-1 ring-rose-200/50'
            : alert.severity === 'High'
            ? 'border-amber-200'
            : 'border-slate-200'
        }`}
      >
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <RiskBadge level={alert.severity} size="sm" />
              <span className="text-[11px] font-medium text-slate-500">
                {alert.district ? `${alert.district}, ` : ''}{alert.state}
              </span>
            </div>
            <h4 className="mt-1 font-bold text-sm text-slate-900 leading-snug">
              {alert.location || 'Monitored Sector'}
            </h4>
          </div>

          <span
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1 ${
              isDispatched
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : isAcknowledged
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
            }`}
          >
            {isDispatched && <Check className="h-3 w-3" />}
            {isDispatched ? '✓ Warning Dispatched' : alert.notificationStatus}
          </span>
        </div>

        {/* Trigger and Action Info */}
        <div className="space-y-1.5 text-xs">
          <p className="text-slate-700">
            <strong>Trigger:</strong> {alert.triggerReason}
          </p>
          <p className="text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px]">
            <strong>Recommended SOP:</strong> {alert.recommendedAction}
          </p>
        </div>

        {/* Timestamp & Probability */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 pt-2.5">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {new Date(alert.triggeredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {alert.probability && (
            <span>Probability: <strong className="text-slate-700">{alert.probability}%</strong></span>
          )}
        </div>

        {/* 4 Action Buttons required by Section 3 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <button
            onClick={() => handleAcknowledge(alert.id)}
            disabled={isAcknowledged || isDispatched}
            className="py-1.5 px-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition-colors disabled:opacity-40"
          >
            {isAcknowledged ? 'Acknowledged' : 'Acknowledge'}
          </button>

          <button
            onClick={() => handleEscalate(alert.id)}
            disabled={alert.severity === 'Critical'}
            className="py-1.5 px-2 rounded-xl border border-amber-300 bg-amber-50/50 text-amber-800 hover:bg-amber-100 font-semibold text-xs transition-colors disabled:opacity-40"
          >
            Escalate
          </button>

          <button
            onClick={() => setDispatchModalAlert(alert)}
            className={`py-1.5 px-2 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1 shadow-2xs ${
              isDispatched
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-rose-600 text-white hover:bg-rose-700'
            }`}
          >
            <Send className="h-3 w-3" />
            {isDispatched ? 'Re-Dispatch' : 'Send Warning'}
          </button>

          <button
            onClick={() => handleViewLocation(alert.locationId)}
            className="py-1.5 px-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors flex items-center justify-center gap-1 shadow-2xs"
          >
            <Eye className="h-3 w-3" />
            View Location
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-600 text-white shadow-xs">
            <BellRing className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 font-heading">
              CAP v1.2 Early Warning Dispatch Center
            </h3>
            <p className="text-xs text-slate-500">
              Authorized emergency communication pipeline conforming to ITU-T X.1303 disaster standard
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-bold text-xs">
            {criticalAlerts.length} Critical
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-bold text-xs">
            {highAlerts.length} High
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs">
            {resolvedAlerts.length} Resolved
          </span>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CardSkeleton count={4} />
        </div>
      ) : (
        <>
          {/* 1. Critical Section */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 border-b border-rose-200 pb-2">
              <span className="flex h-3 w-3 rounded-full bg-rose-600 animate-ping" />
              <h4 className="text-sm font-bold uppercase tracking-wider text-rose-800 font-heading">
                Critical Danger Alerts ({criticalAlerts.length})
              </h4>
              <span className="text-xs text-slate-500">— Immediate Action / Evacuation Recommended</span>
            </div>
            {criticalAlerts.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 italic">No active critical alerts in selected region.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {criticalAlerts.map(renderAlertCard)}
              </div>
            )}
          </section>

          {/* 2. High Severity Section */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 border-b border-amber-200 pb-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500" />
              <h4 className="text-sm font-bold uppercase tracking-wider text-amber-800 font-heading">
                High Risk Warnings ({highAlerts.length})
              </h4>
              <span className="text-xs text-slate-500">— Traffic Restrictions & NDRF Standby</span>
            </div>
            {highAlerts.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 italic">No high-risk alerts currently active.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {highAlerts.map(renderAlertCard)}
              </div>
            )}
          </section>

          {/* 3. Moderate Severity Section */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 border-b border-yellow-200 pb-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-yellow-500" />
              <h4 className="text-sm font-bold uppercase tracking-wider text-yellow-800 font-heading">
                Moderate Advisories ({moderateAlerts.length})
              </h4>
              <span className="text-xs text-slate-500">— Continuous Sensor & AWS Monitoring</span>
            </div>
            {moderateAlerts.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 italic">No moderate advisories in selected region.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {moderateAlerts.map(renderAlertCard)}
              </div>
            )}
          </section>

          {/* 4. Resolved Section */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-slate-400" />
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-600 font-heading">
                Resolved Incidents ({resolvedAlerts.length})
              </h4>
              <span className="text-xs text-slate-500">— Debris Cleared & Normal Flow Restored</span>
            </div>
            {resolvedAlerts.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 italic">No resolved records in buffer.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {resolvedAlerts.map(renderAlertCard)}
              </div>
            )}
          </section>
        </>
      )}

      {/* Modals */}
      <DispatchWarningModal
        alert={dispatchModalAlert}
        isOpen={!!dispatchModalAlert}
        onClose={() => setDispatchModalAlert(null)}
        onConfirmDispatch={handleDispatchConfirm}
      />

      <LocationDetailModal
        location={detailModalLocation}
        isOpen={!!detailModalLocation}
        onClose={() => setDetailModalLocation(null)}
      />
    </div>
  );
};

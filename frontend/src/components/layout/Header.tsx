import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  Bell,
  Clock,
  MapPin,
  ChevronDown,
  User,
  ShieldCheck,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { useFilters } from '../../context/FilterContext';
import { useAuth } from '../../context/AuthContext';
import { NER_STATES } from '../../constants/regions';
import { dataService } from '../../services/dataService';
import type { Alert } from '../../types';
import { RiskBadge } from '../common/RiskBadge';
import { LiveSimulationBadge } from '../common/LiveSimulationBadge';

interface HeaderProps {
  currentPath: string;
  onToggleMobile: () => void;
  onNavigate: (path: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPath,
  onToggleMobile,
  onNavigate
}) => {
  const { selectedState, setSelectedState, selectedDistrict, setSelectedDistrict } = useFilters();
  const { user } = useAuth();

  const [time, setTime] = useState<string>('');
  const [timeMode, setTimeMode] = useState<'IST' | 'UTC'>('IST');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isAlertMenuOpen, setIsAlertMenuOpen] = useState<boolean>(false);
  const alertMenuRef = useRef<HTMLDivElement>(null);

  // Live clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      if (timeMode === 'IST') {
        setTime(
          now.toLocaleTimeString('en-IN', {
            timeZone: 'Asia/Kolkata',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          }) + ' IST'
        );
      } else {
        setTime(
          now.toLocaleTimeString('en-GB', {
            timeZone: 'UTC',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          }) + ' UTC'
        );
      }
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [timeMode]);

  // Alert feed for notification bell
  useEffect(() => {
    let mounted = true;
    async function loadAlerts() {
      try {
        const data = await dataService.getAlerts();
        if (mounted) {
          setAlerts(data.filter((a: Alert) => a.notificationStatus !== 'Acknowledged'));
        }
      } catch {
        // graceful offline
      }
    }
    loadAlerts();

    const unsubscribe = dataService.subscribeLiveUpdates(() => {
      loadAlerts();
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // Click outside to close notification dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (alertMenuRef.current && !alertMenuRef.current.contains(event.target as Node)) {
        setIsAlertMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Districts for current state
  const currentNERState = NER_STATES.find(s => s.name === selectedState);
  const districtList = currentNERState ? currentNERState.districts : [];

  // Path title mapping
  const titleMap: Record<string, { title: string; subtitle: string }> = {
    '/': { title: 'Command Center Overview', subtitle: 'Real-time hazard situation & 3-second rapid triage' },
    '/risk-map': { title: 'GIS Landslide Risk Map', subtitle: 'Multi-layer terrain relief, slope gradients & active hotspots' },
    '/predictions': { title: 'AI Failure Predictions', subtitle: 'LSTM multi-horizon probability & SHAP explainability analysis' },
    '/alerts': { title: 'Early Warning Dispatch', subtitle: 'Common Alerting Protocol (CAP v1.2 / ITU-T X.1303) operations' },
    '/sensors': { title: 'IoT & Remote Sensing Telemetry', subtitle: 'Ground station status, piezometers, InSAR and rain gauges' },
    '/hotspots': { title: 'Critical Hotspots Inventory', subtitle: 'Ranked vulnerability index across North Eastern highway corridors' },
    '/historical': { title: 'Historical Incident Analytics', subtitle: 'Multi-decadal rainfall correlation and prediction validation' },
    '/reports': { title: 'Authoritative Situation Reports', subtitle: 'Daily briefings, evacuation assessments and PDF export' },
    '/settings': { title: 'System Configuration', subtitle: 'Model parameters, threshold cutoffs and telemetry diagnostics' }
  };

  const pageInfo = titleMap[currentPath] || {
    title: 'Command Center',
    subtitle: 'North Eastern Region Landslide Early Warning System'
  };

  return (
    <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-6 backdrop-blur-md">
      {/* Left: Mobile Menu & Page Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleMobile}
          className="lg:hidden flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold tracking-tight text-slate-900 font-heading">
              {pageInfo.title}
            </h2>
            <LiveSimulationBadge className="hidden md:inline-flex" />
          </div>
          <p className="hidden text-xs text-slate-500 sm:block">
            {pageInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Regional Filters, Clock, Notifications & User */}
      <div className="flex items-center gap-3">
        {/* Regional Filter Dropdowns */}
        <div className="hidden xl:flex items-center gap-2 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
          <div className="flex items-center gap-1.5 pl-2 text-xs font-semibold text-slate-600">
            <MapPin className="h-3.5 w-3.5 text-slate-500" />
            <span>Region:</span>
          </div>

          <select
            value={selectedState}
            onChange={e => {
              setSelectedState(e.target.value);
              setSelectedDistrict('');
            }}
            className="rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-slate-800 border border-slate-200 shadow-2xs focus:outline-none focus:ring-1 focus:ring-slate-400"
          >
            <option value="ALL">All 8 NER States</option>
            {NER_STATES.map(state => (
              <option key={state.code} value={state.name}>
                {state.name}
              </option>
            ))}
          </select>

          {selectedState !== 'ALL' && districtList.length > 0 && (
            <select
              value={selectedDistrict}
              onChange={e => setSelectedDistrict(e.target.value)}
              className="rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-slate-800 border border-slate-200 shadow-2xs focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              <option value="">All Districts</option>
              {districtList.map(dist => (
                <option key={dist} value={dist}>
                  {dist}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Live Clock with IST / UTC Toggle */}
        <button
          onClick={() => setTimeMode(prev => (prev === 'IST' ? 'UTC' : 'IST'))}
          className="hidden md:flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          title="Click to toggle IST / UTC"
        >
          <Clock className="h-3.5 w-3.5 text-slate-500" />
          <span className="font-mono">{time || '12:00:00 IST'}</span>
        </button>

        {/* Notification Bell with Unread Badge & Dropdown */}
        <div className="relative" ref={alertMenuRef}>
          <button
            onClick={() => setIsAlertMenuOpen(prev => !prev)}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-2xs"
            aria-label="Alerts"
          >
            <Bell className="h-4.5 w-4.5" />
            {alerts.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-xs">
                {alerts.length}
              </span>
            )}
          </button>

          {/* Dropdown Menu */}
          {isAlertMenuOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl z-50">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-600" />
                  <span className="text-sm font-bold text-slate-900">Active Alert Feed</span>
                </div>
                <button
                  onClick={() => {
                    setIsAlertMenuOpen(false);
                    onNavigate('/alerts');
                  }}
                  className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
                >
                  View All <ExternalLink className="h-3 w-3" />
                </button>
              </div>

              <div className="mt-3 divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {alerts.length === 0 ? (
                  <p className="py-4 text-center text-xs text-slate-500">
                    No unacknowledged warnings. All sectors stable.
                  </p>
                ) : (
                  alerts.slice(0, 5).map(alert => (
                    <div key={alert.id} className="py-2.5 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 truncate max-w-[200px]">
                          {alert.location || 'High Risk Sector'}
                        </span>
                        <RiskBadge level={alert.severity} size="sm" />
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-2">
                        {alert.triggerReason}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* System Health Chip */}
        <div className="hidden lg:flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/70 px-2.5 py-1.5 text-xs font-semibold text-emerald-800">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>SDMA Link Active</span>
        </div>

        {/* User Profile Chip */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white font-bold text-xs shadow-2xs">
            {user?.name ? user.name.charAt(0) : 'P'}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-bold text-slate-900 leading-tight">
              {user?.name || 'Officer Pratham'}
            </div>
            <div className="text-[10px] font-medium text-slate-500">
              {user?.role === 'SDMA_OFFICER' ? 'SDMA Command Officer' : 'Disaster Analyst'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

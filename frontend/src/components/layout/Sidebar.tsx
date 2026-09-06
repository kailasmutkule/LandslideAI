import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Map,
  BrainCircuit,
  BellRing,
  Radio,
  History,
  Flame,
  FileBarChart,
  Settings,
  ChevronRight,
  ShieldAlert,
  Activity,
  LogOut,
  X
} from 'lucide-react';
import { dataService } from '../../services/dataService';
import type { SystemHealth, Alert } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath,
  onNavigate,
  isOpenMobile,
  onCloseMobile
}) => {
  const { logout } = useAuth();
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [criticalCount, setCriticalCount] = useState<number>(0);

  useEffect(() => {
    let mounted = true;

    async function loadStatus() {
      try {
        const [health, alerts] = await Promise.all([
          dataService.getSystemHealth(),
          dataService.getAlerts({ severity: 'Critical' })
        ]);
        if (mounted) {
          setSystemHealth(health);
          setCriticalCount(alerts.filter((a: Alert) => a.notificationStatus !== 'Acknowledged').length);
        }
      } catch {
        if (mounted) {
          setSystemHealth(null);
        }
      }
    }

    loadStatus();

    // Subscribe to live simulation pulses
    const unsubscribe = dataService.subscribeLiveUpdates(() => {
      loadStatus();
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const navItems = [
    { label: 'Overview', path: '/', icon: LayoutDashboard },
    { label: 'Risk Map', path: '/risk-map', icon: Map },
    { label: 'AI Predictions', path: '/predictions', icon: BrainCircuit },
    { label: 'Early Warnings', path: '/alerts', icon: BellRing, badge: criticalCount > 0 ? criticalCount : undefined },
    { label: 'Monitoring & Sensors', path: '/sensors', icon: Radio },
    { label: 'Hotspots', path: '/hotspots', icon: Flame },
    { label: 'Historical Analysis', path: '/historical', icon: History },
    { label: 'Reports', path: '/reports', icon: FileBarChart },
    { label: 'Settings', path: '/settings', icon: Settings }
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col justify-between border-r border-slate-200/80 bg-white transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex flex-col">
          <div className="flex h-20 items-center justify-between border-b border-slate-200/80 px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white shadow-md shadow-slate-900/20">
                <ShieldAlert className="h-6 w-6 text-sky-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-slate-900 font-heading">
                  LANDSLIDE AI
                </h1>
                <p className="text-xs font-medium text-slate-500">
                  NER Landslide Risk Intelligence
                </p>
              </div>
            </div>
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-5">
            <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Command Modules
            </div>
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentPath === item.path;

              return (
                <button
                  key={item.path}
                  onClick={() => {
                    onNavigate(item.path);
                    onCloseMobile();
                  }}
                  className={`group flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-sm font-semibold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`h-4.5 w-4.5 transition-colors ${
                        isActive ? 'text-sky-400' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined ? (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1.5 text-[11px] font-bold text-white shadow-xs">
                      {item.badge}
                    </span>
                  ) : (
                    isActive && <ChevronRight className="h-4 w-4 text-slate-400" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: System Status & User Logout */}
        <div className="border-t border-slate-200/80 p-4 bg-slate-50/60">
          {/* System Status Block (Pulled from dataService) */}
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-slate-600" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  System Telemetry
                </span>
              </div>
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  systemHealth?.status === 'OPERATIONAL'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    systemHealth?.status === 'OPERATIONAL' ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />
                {systemHealth ? systemHealth.status : 'Connecting...'}
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span className="truncate pr-2">AI Engine</span>
                <span className="flex items-center gap-1 text-[11px] font-medium text-slate-900 shrink-0">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Online
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span className="truncate pr-2">Data Pipeline</span>
                <span className="flex items-center gap-1 text-[11px] font-medium text-slate-900 shrink-0">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Live Sync
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span className="truncate pr-2">CAP Alert Relay</span>
                <span className="flex items-center gap-1 text-[11px] font-medium text-slate-900 shrink-0">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  ITU-T Ready
                </span>
              </div>
            </div>
          </div>

          {/* Quick Sign Out Action */}
          <button
            onClick={logout}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-2xs"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out (Officer Pratham)
          </button>
        </div>
      </aside>
    </>
  );
};

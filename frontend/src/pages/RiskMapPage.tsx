import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import type { RiskLocation, Alert } from '../types';
import { RiskMapLeaflet } from '../components/map/RiskMapLeaflet';
import { LocationDetailModal } from '../components/modals/LocationDetailModal';
import { DispatchWarningModal } from '../components/modals/DispatchWarningModal';
import { ErrorState } from '../components/common/ErrorState';
import { MapSkeleton } from '../components/common/LoadingSkeleton';
import { useToast } from '../context/ToastContext';
import { useFilters } from '../context/FilterContext';
import { MapPin, AlertTriangle, Eye, Send, Mountain, Droplets, Compass } from 'lucide-react';
import { RiskBadge } from '../components/common/RiskBadge';

export const RiskMapPage: React.FC = () => {
  const { selectedState, selectedDistrict } = useFilters();
  const { showToast } = useToast();

  const [locations, setLocations] = useState<RiskLocation[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeLocation, setActiveLocation] = useState<RiskLocation | null>(null);
  const [detailModalLocation, setDetailModalLocation] = useState<RiskLocation | null>(null);
  const [dispatchAlert, setDispatchAlert] = useState<Alert | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [locs, alts] = await Promise.all([
        dataService.getLocations({ state: selectedState, district: selectedDistrict }),
        dataService.getAlerts()
      ]);
      setLocations(locs);
      setAlerts(alts);
      if (locs.length > 0 && !activeLocation) {
        setActiveLocation(locs[0]);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load GIS map layers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const unsubscribe = dataService.subscribeLiveUpdates(() => {
      dataService.getLocations({ state: selectedState, district: selectedDistrict })
        .then(setLocations)
        .catch(() => {});
    });
    return () => unsubscribe();
  }, [selectedState, selectedDistrict]);

  const handleDispatchConfirm = async (alertId: string, customMessage: string) => {
    try {
      await dataService.updateAlertStatus(alertId, 'Dispatched', customMessage);
      showToast('✓ Warning Dispatched via CAP v1.2 Protocol', 'success');
      loadData();
    } catch {
      showToast('Failed to dispatch warning', 'error');
    }
  };

  if (error) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  return (
    <div className="space-y-4">
      {/* Top Banner with Quick Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="text-base font-bold text-slate-900 font-heading">
            Full-Screen GIS Landslide Risk Explorer
          </h3>
          <p className="text-xs text-slate-500">
            Interactive 3D hillshade terrain relief, live precipitation sum and active hazard perimeters
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Monitored Hotspots:</span>
          <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg text-xs">
            {locations.length} Sites
          </span>
          <span className="font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg text-xs border border-rose-200">
            {locations.filter(l => l.riskLevel === 'Critical').length} Critical
          </span>
        </div>
      </div>

      {/* Main Map + Selected Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Full-screen Leaflet Map (9 cols) */}
        <div className="lg:col-span-8 xl:col-span-9 h-[620px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 relative">
          {loading ? (
            <MapSkeleton />
          ) : (
            <RiskMapLeaflet
              locations={locations}
              height="620px"
              selectedLocationId={activeLocation?.id}
              onSelectLocation={loc => setActiveLocation(loc)}
            />
          )}
        </div>

        {/* Selected Location Telemetry Inspector Drawer (3 cols) */}
        <div className="lg:col-span-4 xl:col-span-3 flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="border-b border-slate-100 pb-3 mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Sector Telemetry Inspector
            </h4>
            <div className="mt-1 flex items-start justify-between gap-2">
              <div>
                <h3 className="font-bold text-sm text-slate-900 leading-snug">
                  {activeLocation ? activeLocation.location : 'Select a Hotspot'}
                </h3>
                <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3 text-slate-400" />
                  {activeLocation ? `${activeLocation.district || ''}, ${activeLocation.state}` : 'North Eastern Region'}
                </p>
              </div>
              {activeLocation && <RiskBadge level={activeLocation.riskLevel} size="sm" />}
            </div>
          </div>

          {activeLocation ? (
            <div className="flex-1 space-y-4 overflow-y-auto pr-1">
              {/* Score breakdown */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-around text-center">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500">Risk Score</div>
                  <div className="text-2xl font-extrabold text-slate-900 font-heading">
                    {activeLocation.riskScore}
                  </div>
                </div>
                <div className="h-8 w-[1px] bg-slate-200" />
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500">Probability</div>
                  <div className="text-2xl font-extrabold text-slate-900 font-heading">
                    {activeLocation.probability}%
                  </div>
                </div>
                <div className="h-8 w-[1px] bg-slate-200" />
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500">Confidence</div>
                  <div className="text-2xl font-extrabold text-sky-700 font-heading">
                    {activeLocation.confidence}%
                  </div>
                </div>
              </div>

              {/* Environmental Metrics */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Field Conditions
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-1 text-slate-500 text-[10px]">
                      <Droplets className="h-3 w-3 text-sky-600" />
                      Rainfall 24h
                    </div>
                    <span className="font-bold text-slate-900">{activeLocation.rainfall24h} mm</span>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-1 text-slate-500 text-[10px]">
                      <Mountain className="h-3 w-3 text-amber-600" />
                      Slope Angle
                    </div>
                    <span className="font-bold text-slate-900">{activeLocation.slope}°</span>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-1 text-slate-500 text-[10px]">
                      <Compass className="h-3 w-3 text-purple-600" />
                      Soil Moisture
                    </div>
                    <span className="font-bold text-slate-900">{activeLocation.soilMoisture}%</span>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-1 text-slate-500 text-[10px]">
                      Ground Sat.
                    </div>
                    <span className="font-bold text-slate-900">{activeLocation.groundSaturation}%</span>
                  </div>
                </div>
              </div>

              {/* Primary Trigger & Window */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                <div className="font-semibold text-slate-800 flex items-start gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>{activeLocation.primaryTrigger}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Expected Impact Window: <strong>{activeLocation.expectedWindow}</strong>
                </div>
                <div className="text-[11px] text-slate-500">
                  Recommended: {activeLocation.recommendedAction}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => setDetailModalLocation(activeLocation)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-2xs"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Open Deep AI Diagnostic
                </button>

                <button
                  onClick={() => {
                    const matchAlert = alerts.find(a => a.locationId === activeLocation.id) || {
                      id: `alt-${activeLocation.id}`,
                      locationId: activeLocation.id,
                      location: activeLocation.location,
                      state: activeLocation.state,
                      district: activeLocation.district,
                      severity: (activeLocation.riskLevel === 'Low' ? 'Moderate' : activeLocation.riskLevel),
                      triggerReason: activeLocation.primaryTrigger || 'Hazard condition',
                      triggeredAt: new Date().toISOString(),
                      recommendedAction: activeLocation.recommendedAction || 'Evacuation caution',
                      notificationStatus: 'Pending',
                      riskScore: activeLocation.riskScore,
                      probability: activeLocation.probability
                    };
                    setDispatchAlert(matchAlert);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-rose-300 bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100 transition-colors shadow-2xs"
                >
                  <Send className="h-3.5 w-3.5" />
                  Dispatch Warning Notice
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <MapPin className="h-8 w-8 mb-2 text-slate-300" />
              <p className="text-xs">Click any pulsing marker on the GIS map to inspect live environmental metrics.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <LocationDetailModal
        location={detailModalLocation}
        isOpen={!!detailModalLocation}
        onClose={() => setDetailModalLocation(null)}
        onDispatchWarning={loc => {
          setDetailModalLocation(null);
          const matchAlert = alerts.find(a => a.locationId === loc.id) || {
            id: `alt-${loc.id}`,
            locationId: loc.id,
            location: loc.location,
            state: loc.state,
            district: loc.district,
            severity: (loc.riskLevel === 'Low' ? 'Moderate' : loc.riskLevel),
            triggerReason: loc.primaryTrigger || 'Threshold exceeded',
            triggeredAt: new Date().toISOString(),
            recommendedAction: loc.recommendedAction || 'Evacuation caution',
            notificationStatus: 'Pending'
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

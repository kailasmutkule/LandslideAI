import React, { useState, useEffect } from 'react';
import {
  Radio,
  Battery,
  BatteryCharging,
  BatteryWarning,
  Signal,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Layers,
  Map as MapIcon,
  ListFilter,
  RefreshCw,
  Sun
} from 'lucide-react';
import { dataService } from '../services/dataService';
import type { SensorItem, SensorType, SensorStatus } from '../types';
import { CardSkeleton, TableSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorState } from '../components/common/ErrorState';
import { EmptyState } from '../components/common/EmptyState';
import { useFilters } from '../context/FilterContext';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { NER_CENTER } from '../constants/regions';

export const SensorsPage: React.FC = () => {
  const { selectedState } = useFilters();

  const [sensors, setSensors] = useState<SensorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & View Mode
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'cards' | 'map'>('cards');

  const loadSensors = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dataService.getSensors({
        type: typeFilter !== 'ALL' ? typeFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined
      });
      setSensors(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load monitoring sensor stations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSensors();

    const unsubscribe = dataService.subscribeLiveUpdates(() => {
      loadSensors();
    });
    return () => unsubscribe();
  }, [typeFilter, statusFilter]);

  // Apply state filter if selected
  const filteredSensors = sensors.filter(s => {
    if (selectedState === 'ALL') return true;
    return s.state.toLowerCase() === selectedState.toLowerCase();
  });

  // Calculate stats
  const onlineCount = sensors.filter(s => s.status === 'online').length;
  const warningCount = sensors.filter(s => s.status === 'warning').length;
  const offlineCount = sensors.filter(s => s.status === 'offline').length;

  const sensorTypeMap: Record<SensorType, string> = {
    rain_gauge: 'Tipping Rain Gauge',
    soil_moisture: 'TDR Soil Moisture Probe',
    inclinometer: 'MEMS Inclinometer',
    weather_station: 'Automatic Weather Station',
    piezometer: 'Piezometer Pore Sensor',
    insar_reflector: 'InSAR Corner Reflector'
  };

  // Custom marker for map view
  const createSensorIcon = (status: SensorStatus) => {
    const color = status === 'online' ? '#10b981' : status === 'warning' ? '#f59e0b' : '#ef4444';
    return L.divIcon({
      html: `
        <div style="width: 22px; height: 22px; border-radius: 50%; background: ${color}; border: 2.5px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
          <div style="width: 6px; height: 6px; border-radius: 50%; background: #ffffff;"></div>
        </div>
      `,
      className: 'sensor-marker',
      iconSize: [22, 22],
      iconAnchor: [11, 11]
    });
  };

  if (error) {
    return <ErrorState message={error} onRetry={loadSensors} />;
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs">
            <Radio className="h-6 w-6 text-sky-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 font-heading">
              Monitoring & IoT Ground Sensor Network
            </h3>
            <p className="text-xs text-slate-500">
              Live telemetry tracking rain gauges, inclinometers, piezometers, and InSAR corner reflectors
            </p>
          </div>
        </div>

        {/* Telemetry Health Summary Chips */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            {onlineCount} Online
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-bold text-xs">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            {warningCount} Warning
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-bold text-xs">
            <XCircle className="h-3.5 w-3.5 text-rose-600" />
            {offlineCount} Offline
          </span>
        </div>
      </div>

      {/* Filter and View Mode Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Sensor Type Filter */}
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 font-semibold text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Sensor Types (6 Categories)</option>
            <option value="rain_gauge">Rain Gauge Stations</option>
            <option value="soil_moisture">Soil Moisture Probes</option>
            <option value="inclinometer">MEMS Inclinometers</option>
            <option value="weather_station">Automatic Weather Stations</option>
            <option value="piezometer">Pore Pressure Piezometers</option>
            <option value="insar_reflector">InSAR Corner Reflectors</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 font-semibold text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="online">Online Only</option>
            <option value="warning">Warning Only</option>
            <option value="offline">Offline Only</option>
          </select>
        </div>

        {/* View Mode Toggle (Cards vs Map) */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setViewMode('cards')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              viewMode === 'cards'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ListFilter className="h-3.5 w-3.5" />
            Sensor Cards List
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              viewMode === 'map'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapIcon className="h-3.5 w-3.5" />
            Sensors GIS Map
          </button>
        </div>
      </div>

      {/* Content: Cards View or Map View */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <CardSkeleton count={6} />
        </div>
      ) : filteredSensors.length === 0 ? (
        <EmptyState
          title="No Sensor Stations Found"
          description="Adjust your sensor type or status filter criteria to display active stations."
          onReset={() => {
            setTypeFilter('ALL');
            setStatusFilter('ALL');
          }}
        />
      ) : viewMode === 'map' ? (
        /* GIS Sensor Map View */
        <div className="h-[580px] w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative">
          <MapContainer
            center={[NER_CENTER.lat, NER_CENTER.lng]}
            zoom={7}
            style={{ width: '100%', height: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
            {filteredSensors.map(sensor => (
              <Marker
                key={sensor.id}
                position={[sensor.latitude, sensor.longitude]}
                icon={createSensorIcon(sensor.status)}
              >
                <Popup>
                  <div className="p-3 w-64 space-y-2">
                    <div className="flex items-start justify-between">
                      <h5 className="font-bold text-xs text-slate-900">{sensor.name}</h5>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        sensor.status === 'online' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {sensor.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">{sensorTypeMap[sensor.type]}</p>
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-[11px]">
                      <strong>Last Reading:</strong> {sensor.lastReading}
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Battery: {sensor.battery}%</span>
                      <span>Signal: {sensor.signalQuality}</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      ) : (
        /* Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSensors.map(sensor => {
            let statusBadge = (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Online
              </span>
            );
            if (sensor.status === 'warning') {
              statusBadge = (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  Warning
                </span>
              );
            } else if (sensor.status === 'offline') {
              statusBadge = (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                  Offline
                </span>
              );
            }

            return (
              <div
                key={sensor.id}
                className="tilt-card rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition-all space-y-3"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      {sensorTypeMap[sensor.type] || sensor.type}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 leading-snug mt-0.5">
                      {sensor.name}
                    </h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 text-slate-400" />
                      {sensor.location}, {sensor.state}
                    </p>
                  </div>
                  {statusBadge}
                </div>

                {/* Last Reading Box */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                    Latest Telemetry Value
                  </span>
                  <div className="text-xs font-bold text-slate-900">
                    {sensor.lastReading}
                  </div>
                </div>

                {/* Battery, Solar & Connectivity Status */}
                <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    {sensor.solarCharging ? (
                      <Sun className="h-4 w-4 text-amber-500 shrink-0" />
                    ) : sensor.battery > 50 ? (
                      <Battery className="h-4 w-4 text-emerald-600 shrink-0" />
                    ) : (
                      <BatteryWarning className="h-4 w-4 text-rose-500 shrink-0" />
                    )}
                    <span>
                      {sensor.battery}% {sensor.solarCharging ? '(Solar)' : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-600 truncate" title={sensor.signalQuality}>
                    <Signal className="h-4 w-4 text-sky-600 shrink-0" />
                    <span className="truncate">{sensor.signalQuality}</span>
                  </div>
                </div>

                {/* Firmware Version */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                  <span>Firmware: {sensor.firmwareVersion || 'v2.4.1'}</span>
                  <span>ID: {sensor.id}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

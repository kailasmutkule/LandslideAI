import React, { useState, useEffect } from 'react';
import {
  Flame,
  TrendingUp,
  TrendingDown,
  Minus,
  MapPin,
  Droplets,
  Mountain,
  Compass,
  Calendar,
  Eye,
  Search,
  ArrowUpDown
} from 'lucide-react';
import { dataService } from '../services/dataService';
import type { RiskLocation } from '../types';
import { RiskBadge } from '../components/common/RiskBadge';
import { CardSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorState } from '../components/common/ErrorState';
import { EmptyState } from '../components/common/EmptyState';
import { LocationDetailModal } from '../components/modals/LocationDetailModal';
import { useFilters } from '../context/FilterContext';

export const HotspotsPage: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const { selectedState, selectedDistrict } = useFilters();

  const [locations, setLocations] = useState<RiskLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<RiskLocation | null>(null);
  const [sortBy, setSortBy] = useState<'riskScore' | 'rainfall' | 'slope' | 'incidents'>('riskScore');

  const loadHotspots = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dataService.getLocations({
        state: selectedState,
        district: selectedDistrict
      });
      setLocations(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load hotspot ranking.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHotspots();

    const unsubscribe = dataService.subscribeLiveUpdates(() => {
      dataService.getLocations({ state: selectedState, district: selectedDistrict })
        .then(setLocations)
        .catch(() => {});
    });
    return () => unsubscribe();
  }, [selectedState, selectedDistrict]);

  // Sort and filter
  const sortedLocations = [...locations].sort((a, b) => {
    if (sortBy === 'riskScore') return b.riskScore - a.riskScore;
    if (sortBy === 'rainfall') return b.rainfall24h - a.rainfall24h;
    if (sortBy === 'slope') return b.slope - a.slope;
    if (sortBy === 'incidents') return (b.historicalIncidentsCount || 0) - (a.historicalIncidentsCount || 0);
    return 0;
  });

  const filteredHotspots = sortedLocations.filter(loc => {
    return (
      searchQuery.trim() === '' ||
      loc.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (loc.district && loc.district.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  if (error) {
    return <ErrorState message={error} onRetry={loadHotspots} />;
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-600 text-white shadow-xs">
            <Flame className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 font-heading">
              Ranked Vulnerable Hotspots & Corridors
            </h3>
            <p className="text-xs text-slate-500">
              Ranked priority index combining static geological susceptibility and real-time precipitation trigger load
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Sort Priority:</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="riskScore">Highest Risk Score (Default)</option>
            <option value="rainfall">Maximum 24h Rainfall</option>
            <option value="slope">Steepest Slope Angle</option>
            <option value="incidents">Historical Failure Frequency</option>
          </select>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="flex items-center gap-2 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs max-w-md">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Filter ranked hotspots by highway, pass, town..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full text-xs font-medium text-slate-800 placeholder-slate-400 bg-transparent border-none focus:outline-none"
        />
      </div>

      {/* Ranked Hotspot List */}
      {loading ? (
        <div className="space-y-3">
          <CardSkeleton count={5} />
        </div>
      ) : filteredHotspots.length === 0 ? (
        <EmptyState
          title="No Hotspots Match Search"
          description="Clear your search term to see all monitored regional corridors."
          onReset={() => setSearchQuery('')}
        />
      ) : (
        <div className="space-y-3">
          {filteredHotspots.map((loc, rank) => {
            const isTop3 = rank < 3;

            return (
              <div
                key={loc.id}
                onClick={() => setSelectedLocation(loc)}
                className={`tilt-card group relative flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border bg-white p-5 shadow-xs transition-all hover:shadow-md cursor-pointer ${
                  isTop3 && loc.riskLevel === 'Critical'
                    ? 'border-rose-200 ring-1 ring-rose-200/50'
                    : 'border-slate-200'
                }`}
              >
                {/* Left: Rank badge & Location info */}
                <div className="flex items-start gap-3.5">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-sm font-heading ${
                      rank === 0
                        ? 'bg-rose-600 text-white shadow-xs'
                        : rank === 1
                        ? 'bg-amber-500 text-white shadow-xs'
                        : rank === 2
                        ? 'bg-yellow-500 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    #{rank + 1}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <RiskBadge level={loc.riskLevel} size="sm" />
                      <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        {loc.district ? `${loc.district}, ` : ''}{loc.state} &bull; {loc.elevation || 1200}m
                      </span>
                    </div>

                    <h4 className="mt-1 font-bold text-sm text-slate-900 group-hover:text-sky-600 transition-colors">
                      {loc.location}
                    </h4>

                    <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">
                      {loc.primaryTrigger}
                    </p>
                  </div>
                </div>

                {/* Right: Metrics row & Trend */}
                <div className="flex flex-wrap items-center gap-4 text-xs border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                  {/* Trend */}
                  <div className="flex items-center gap-1">
                    {loc.trend === 'Rising' ? (
                      <span className="flex items-center gap-1 text-rose-600 font-bold bg-rose-50 px-2 py-1 rounded-lg">
                        <TrendingUp className="h-3.5 w-3.5" /> Rising
                      </span>
                    ) : loc.trend === 'Falling' ? (
                      <span className="flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-lg">
                        <TrendingDown className="h-3.5 w-3.5" /> Falling
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-slate-600 font-bold bg-slate-100 px-2 py-1 rounded-lg">
                        <Minus className="h-3.5 w-3.5" /> Stable
                      </span>
                    )}
                  </div>

                  {/* Rainfall */}
                  <div className="text-center px-2">
                    <span className="text-[10px] text-slate-400 block font-bold">Rain 24h</span>
                    <span className="font-bold text-slate-900 text-sm flex items-center gap-1">
                      <Droplets className="h-3 w-3 text-sky-500" /> {loc.rainfall24h} mm
                    </span>
                  </div>

                  {/* Slope */}
                  <div className="text-center px-2">
                    <span className="text-[10px] text-slate-400 block font-bold">Slope</span>
                    <span className="font-bold text-slate-900 text-sm flex items-center gap-1">
                      <Mountain className="h-3 w-3 text-amber-500" /> {loc.slope}°
                    </span>
                  </div>

                  {/* Soil Moisture */}
                  <div className="text-center px-2">
                    <span className="text-[10px] text-slate-400 block font-bold">Moisture</span>
                    <span className="font-bold text-slate-900 text-sm flex items-center gap-1">
                      <Compass className="h-3 w-3 text-purple-500" /> {loc.soilMoisture}%
                    </span>
                  </div>

                  {/* Historical Incidents Count */}
                  <div className="text-center px-2">
                    <span className="text-[10px] text-slate-400 block font-bold">Hist. Events</span>
                    <span className="font-bold text-slate-700 text-sm flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-slate-400" /> {loc.historicalIncidentsCount || 8}
                    </span>
                  </div>

                  {/* Score pill */}
                  <div className="text-center pl-2">
                    <span
                      className={`inline-block px-3 py-1 rounded-xl text-base font-extrabold font-heading ${
                        loc.riskScore >= 80
                          ? 'bg-rose-600 text-white shadow-xs'
                          : loc.riskScore >= 68
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {loc.riskScore}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedLocation(loc);
                    }}
                    className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Location Details Modal */}
      <LocationDetailModal
        location={selectedLocation}
        isOpen={!!selectedLocation}
        onClose={() => setSelectedLocation(null)}
      />
    </div>
  );
};

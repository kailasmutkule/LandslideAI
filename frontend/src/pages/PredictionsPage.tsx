import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import type { RiskLocation, PredictionRequest, PredictionResult } from '../types';
import { RiskBadge } from '../components/common/RiskBadge';
import { TableSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorState } from '../components/common/ErrorState';
import { EmptyState } from '../components/common/EmptyState';
import { LocationDetailModal } from '../components/modals/LocationDetailModal';
import { useFilters } from '../context/FilterContext';
import {
  BrainCircuit,
  Search,
  Sliders,
  Sparkles,
  ArrowUpDown,
  Eye,
  CheckCircle2,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

export const PredictionsPage: React.FC = () => {
  const { selectedState, selectedDistrict } = useFilters();

  const [locations, setLocations] = useState<RiskLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [minProbability, setMinProbability] = useState<number>(0);
  const [timeWindowFilter, setTimeWindowFilter] = useState<string>('ALL');
  const [tableSearch, setTableSearch] = useState<string>('');

  // Selected Location for Modal
  const [detailLocation, setDetailLocation] = useState<RiskLocation | null>(null);

  // What-If Simulator State
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simForm, setSimForm] = useState<PredictionRequest>({
    location_name: 'Custom Highway Slope (Simulated)',
    latitude: 27.3389,
    longitude: 88.6065,
    slope: 42,
    rainfall_24h: 125,
    soil_moisture: 84
  });
  const [simResult, setSimResult] = useState<PredictionResult | null>(null);

  const loadPredictions = async () => {
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
      setError(err.message || 'Failed to retrieve AI predictions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPredictions();

    const unsubscribe = dataService.subscribeLiveUpdates(() => {
      dataService.getLocations({ state: selectedState, district: selectedDistrict })
        .then(setLocations)
        .catch(() => {});
    });
    return () => unsubscribe();
  }, [selectedState, selectedDistrict]);

  // Run What-If Prediction
  const handleRunSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSimulating(true);
    try {
      const result = await dataService.runCustomPrediction(simForm);
      setSimResult(result);
    } catch (err: any) {
      console.error('Simulation error', err);
    } finally {
      setIsSimulating(false);
    }
  };

  // Filter table records
  const filteredPredictions = locations.filter(loc => {
    const matchesRisk = riskFilter === 'ALL' || loc.riskLevel === riskFilter;
    const matchesProb = loc.probability >= minProbability;
    const matchesWindow =
      timeWindowFilter === 'ALL' ||
      (loc.expectedWindow && loc.expectedWindow.includes(timeWindowFilter));
    const matchesSearch =
      tableSearch.trim() === '' ||
      loc.location.toLowerCase().includes(tableSearch.toLowerCase()) ||
      loc.state.toLowerCase().includes(tableSearch.toLowerCase()) ||
      (loc.primaryTrigger && loc.primaryTrigger.toLowerCase().includes(tableSearch.toLowerCase()));

    return matchesRisk && matchesProb && matchesWindow && matchesSearch;
  });

  if (error) {
    return <ErrorState message={error} onRetry={loadPredictions} />;
  }

  return (
    <div className="space-y-6">
      {/* Header & Overview Brief */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 font-heading flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-sky-600" />
              Multi-Horizon AI Landslide Risk Predictions
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              LandslideAI-LSTM v1.0
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time inference synthesizing IMERG rainfall accumulation, CartoDEM slope, and Sentinel-1 deformation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Evaluated Hotspots:</span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-bold text-xs">
            {filteredPredictions.length} / {locations.length} Sites
          </span>
        </div>
      </div>

      {/* Interactive What-If Simulator Widget */}
      <div className="rounded-2xl border border-sky-200 bg-linear-to-r from-sky-50/50 via-white to-blue-50/40 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3 border-b border-sky-100 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-sky-600" />
            <h4 className="text-sm font-bold text-slate-900 font-heading">
              Interactive "What-If" Slope Failure Simulator
            </h4>
          </div>
          <span className="text-[11px] text-slate-500">
            Simulate hypothetical monsoon storms and slope gradients
          </span>
        </div>

        <form onSubmit={handleRunSimulation} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Hypothetical Rainfall 24h (mm): <strong className="text-sky-700">{simForm.rainfall_24h} mm</strong>
            </label>
            <input
              type="range"
              min={10}
              max={280}
              step={5}
              value={simForm.rainfall_24h}
              onChange={e => setSimForm({ ...simForm, rainfall_24h: Number(e.target.value) })}
              className="w-full accent-sky-600"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Slope Gradient (degrees): <strong className="text-amber-700">{simForm.slope}°</strong>
            </label>
            <input
              type="range"
              min={15}
              max={65}
              step={1}
              value={simForm.slope}
              onChange={e => setSimForm({ ...simForm, slope: Number(e.target.value) })}
              className="w-full accent-amber-600"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Soil Moisture (%): <strong className="text-purple-700">{simForm.soil_moisture}%</strong>
            </label>
            <input
              type="range"
              min={30}
              max={99}
              step={1}
              value={simForm.soil_moisture}
              onChange={e => setSimForm({ ...simForm, soil_moisture: Number(e.target.value) })}
              className="w-full accent-purple-600"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isSimulating}
              className="w-full py-2 px-4 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-2xs disabled:opacity-50"
            >
              {isSimulating ? 'Computing Inference...' : 'Run Simulation'}
            </button>
          </div>
        </form>

        {/* Simulation Output Card (if generated) */}
        {simResult && (
          <div className="mt-4 p-4 rounded-xl bg-white border border-sky-200 shadow-xs animate-in fade-in">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5 mb-2.5">
              <div className="flex items-center gap-2">
                <RiskBadge level={simResult.risk_level} size="sm" />
                <span className="text-xs font-bold text-slate-900">
                  Predicted Hazard Score: {simResult.risk_score}/100 &bull; Failure Probability: {simResult.probability}%
                </span>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                Confidence: {simResult.confidence}% &bull; Window: {simResult.expected_window}
              </span>
            </div>
            <p className="text-xs text-slate-700 mb-2 leading-relaxed">
              {simResult.plain_language_reasoning}
            </p>
            <div className="text-[11px] text-amber-900 bg-amber-50 p-2 rounded-lg border border-amber-200">
              <strong>Recommended Directive:</strong> {simResult.recommended_sop}
            </div>
          </div>
        )}
      </div>

      {/* Filter Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        {/* Search Input */}
        <div className="flex items-center gap-2 bg-slate-100/80 px-3 py-1.5 rounded-xl border border-slate-200 max-w-xs w-full text-xs">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search location, road, primary trigger..."
            value={tableSearch}
            onChange={e => setTableSearch(e.target.value)}
            className="w-full bg-transparent border-none focus:outline-none text-slate-800 placeholder-slate-400"
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Risk Level Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl font-semibold">
            {(['ALL', 'Critical', 'High', 'Moderate', 'Low'] as const).map(lvl => (
              <button
                key={lvl}
                onClick={() => setRiskFilter(lvl)}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  riskFilter === lvl
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          {/* Probability Slider Filter */}
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl font-medium text-slate-600">
            <span>Prob &gt; {minProbability}%</span>
            <input
              type="range"
              min={0}
              max={90}
              step={10}
              value={minProbability}
              onChange={e => setMinProbability(Number(e.target.value))}
              className="w-20 accent-slate-700"
            />
          </div>

          {/* Time Window Filter */}
          <select
            value={timeWindowFilter}
            onChange={e => setTimeWindowFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Impact Windows</option>
            <option value="3-6 Hours">Immediate (&lt;6h)</option>
            <option value="12-24 Hours">Medium (12-24h)</option>
            <option value=">48 Hours">Long Range (&gt;48h)</option>
          </select>
        </div>
      </div>

      {/* Predictions Table (Stacked Cards on Mobile, Table on Desktop per Section 2) */}
      {loading ? (
        <TableSkeleton rows={8} />
      ) : filteredPredictions.length === 0 ? (
        <EmptyState
          title="No Matching Predictions"
          description="Try adjusting your probability threshold or risk filter to view other sectors."
          onReset={() => {
            setRiskFilter('ALL');
            setMinProbability(0);
            setTimeWindowFilter('ALL');
            setTableSearch('');
          }}
        />
      ) : (
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Location / Corridor</th>
                  <th className="py-3 px-3 text-center">Risk Score</th>
                  <th className="py-3 px-3 text-center">Probability</th>
                  <th className="py-3 px-3 text-center">Expected Window</th>
                  <th className="py-3 px-3 text-center">Confidence</th>
                  <th className="py-3 px-4">Primary Trigger</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPredictions.map(loc => (
                  <tr key={loc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div>{loc.location}</div>
                      <div className="text-[11px] text-slate-500 font-normal">
                        {loc.district ? `${loc.district}, ` : ''}{loc.state}
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-center font-bold">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-lg text-xs ${
                          loc.riskScore >= 80
                            ? 'bg-rose-100 text-rose-800'
                            : loc.riskScore >= 68
                            ? 'bg-amber-100 text-amber-800'
                            : loc.riskScore >= 50
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {loc.riskScore}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-center font-semibold text-slate-800">
                      {loc.probability}%
                    </td>

                    <td className="py-3.5 px-3 text-center font-medium text-slate-600">
                      {loc.expectedWindow || '12-24h'}
                    </td>

                    <td className="py-3.5 px-3 text-center font-semibold text-sky-700">
                      {loc.confidence}%
                    </td>

                    <td className="py-3.5 px-4 text-slate-700 max-w-xs truncate" title={loc.primaryTrigger}>
                      {loc.primaryTrigger || 'Monsoon slope surcharge'}
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <RiskBadge level={loc.riskLevel} size="sm" />
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setDetailLocation(loc)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 font-semibold text-xs transition-colors shadow-2xs"
                      >
                        <Eye className="h-3 w-3" />
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Cards View */}
          <div className="md:hidden divide-y divide-slate-100 p-3 space-y-3">
            {filteredPredictions.map(loc => (
              <div key={loc.id} className="p-3 rounded-xl bg-slate-50 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm">{loc.location}</h5>
                    <p className="text-xs text-slate-500">{loc.district}, {loc.state}</p>
                  </div>
                  <RiskBadge level={loc.riskLevel} size="sm" />
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs py-1">
                  <div className="bg-white p-1.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Score</span>
                    <strong className="text-slate-900">{loc.riskScore}</strong>
                  </div>
                  <div className="bg-white p-1.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Prob.</span>
                    <strong className="text-slate-900">{loc.probability}%</strong>
                  </div>
                  <div className="bg-white p-1.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Confidence</span>
                    <strong className="text-sky-700">{loc.confidence}%</strong>
                  </div>
                </div>
                <p className="text-xs text-slate-600">
                  <strong>Trigger:</strong> {loc.primaryTrigger}
                </p>
                <button
                  onClick={() => setDetailLocation(loc)}
                  className="w-full py-2 rounded-lg bg-slate-900 text-white text-xs font-bold"
                >
                  View Full Trajectory
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Location Details Modal */}
      <LocationDetailModal
        location={detailLocation}
        isOpen={!!detailLocation}
        onClose={() => setDetailLocation(null)}
      />
    </div>
  );
};

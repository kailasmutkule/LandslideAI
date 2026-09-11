import React, { useEffect, useState } from "react";
import { dataService } from "../services/dataService";
import type {
  RiskLocation,
  PredictionRequest,
  PredictionResult,
} from "../types";
import { RiskBadge } from "../components/common/RiskBadge";
import { TableSkeleton } from "../components/common/LoadingSkeleton";
import { ErrorState } from "../components/common/ErrorState";
import { EmptyState } from "../components/common/EmptyState";
import { LocationDetailModal } from "../components/modals/LocationDetailModal";
import { useFilters } from "../context/FilterContext";
import { BrainCircuit, Search, Sparkles, Eye } from "lucide-react";

const DEFAULT_LOCATION_ID = "3cd3322a-9874-4f61-be6f-397da050a94c";

export const PredictionsPage: React.FC = () => {
  const { selectedState, selectedDistrict } = useFilters();

  const [locations, setLocations] = useState<RiskLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [riskFilter, setRiskFilter] = useState("ALL");
  const [minProbability, setMinProbability] = useState(0);
  const [timeWindowFilter, setTimeWindowFilter] = useState("ALL");
  const [tableSearch, setTableSearch] = useState("");

  const [detailLocation, setDetailLocation] = useState<RiskLocation | null>(
    null,
  );

  const [isSimulating, setIsSimulating] = useState(false);

  const [simForm, setSimForm] = useState<PredictionRequest>({
    location_id: DEFAULT_LOCATION_ID,
    latitude: 24.478972,
    longitude: 92.682861,

    rainfall_1d: 129.3,
    rainfall_3d: 129.3,
    rainfall_7d: 129.3,
    rainfall_30d: 129.3,

    rainfall_1d_available: 1,
    rainfall_3d_available: 1,
    rainfall_7d_available: 1,
    rainfall_30d_available: 1,

    elevation_m: 100,
    slope_degrees: 20,

    event_date: new Date().toISOString().split("T")[0],
  });

  const [simResult, setSimResult] = useState<PredictionResult | null>(null);

  const updateLocation = (data: RiskLocation[]) => {
    setLocations(data);

    if (data.length === 0) {
      return;
    }

    const firstLocation = data[0];

    setSimForm((previous) => ({
      ...previous,
      location_id: firstLocation.id,
      latitude: firstLocation.lat,
      longitude: firstLocation.lon,
    }));
  };

  const loadPredictions = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await dataService.getLocations({
        state: selectedState,
        district: selectedDistrict,
      });

      updateLocation(data);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to retrieve AI predictions.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPredictions();

    const unsubscribe = dataService.subscribeLiveUpdates(() => {
      dataService
        .getLocations({
          state: selectedState,
          district: selectedDistrict,
        })
        .then(updateLocation)
        .catch((err) => {
          console.error(err);
        });
    });

    return () => {
      unsubscribe();
    };
  }, [selectedState, selectedDistrict]);

  const handleLocationChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const locationId = event.target.value;

    const selectedLocation = locations.find(
      (location) => location.id === locationId,
    );

    if (!selectedLocation) {
      return;
    }

    setSimForm((previous) => ({
      ...previous,
      location_id: selectedLocation.id,
      latitude: selectedLocation.lat,
      longitude: selectedLocation.lon,
    }));

    setSimResult(null);
  };

  const handleRunSimulation = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    try {
      setIsSimulating(true);
      setError(null);

      const request: PredictionRequest = {
        ...simForm,
        event_date: new Date().toISOString().split("T")[0],
      };

      const result = await dataService.runCustomPrediction(request);

      setSimResult(result);
    } catch (err) {
      console.error("Prediction error:", err);

      setError(err instanceof Error ? err.message : "ML prediction failed.");
    } finally {
      setIsSimulating(false);
    }
  };

  const updateNumber = (field: keyof PredictionRequest, value: number) => {
    setSimForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const getDisplayRiskLevel = (
    level: PredictionResult["risk_level"],
  ): "Low" | "Moderate" | "High" | "Critical" => {
    if (level === "LOW") return "Low";
    if (level === "MEDIUM") return "Moderate";
    if (level === "HIGH") return "High";
    if (level === "CRITICAL") return "Critical";

    return "Low";
  };

  const filteredPredictions = locations.filter((location) => {
    const matchesRisk =
      riskFilter === "ALL" || location.riskLevel === riskFilter;

    const matchesProbability = location.probability >= minProbability;

    const matchesWindow =
      timeWindowFilter === "ALL" ||
      (location.expectedWindow &&
        location.expectedWindow.includes(timeWindowFilter));

    const search = tableSearch.toLowerCase().trim();

    const matchesSearch =
      search === "" ||
      location.location.toLowerCase().includes(search) ||
      location.state.toLowerCase().includes(search) ||
      Boolean(
        location.primaryTrigger &&
        location.primaryTrigger.toLowerCase().includes(search),
      );

    return matchesRisk && matchesProbability && matchesWindow && matchesSearch;
  });

  if (error) {
    return <ErrorState message={error} onRetry={loadPredictions} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 font-heading flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-sky-600" />
              AI Landslide Risk Predictions
            </h3>

            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              XGBoost Temporal
            </span>
          </div>

          <p className="text-xs text-slate-500 mt-0.5">
            XGBoost inference using rainfall accumulation, terrain
            characteristics and historical landslide data
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">
            Evaluated Hotspots:
          </span>

          <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-bold text-xs">
            {filteredPredictions.length} / {locations.length} Sites
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-sky-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4 border-b border-sky-100 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-sky-600" />

            <h4 className="text-sm font-bold text-slate-900 font-heading">
              Interactive "What-If" Landslide Simulator
            </h4>
          </div>

          <span className="text-[11px] text-slate-500">
            Test rainfall and terrain conditions
          </span>
        </div>

        <form
          onSubmit={handleRunSimulation}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Monitoring Location
            </label>

            <select
              value={simForm.location_id}
              onChange={handleLocationChange}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
            >
              {locations.length === 0 ? (
                <option value={DEFAULT_LOCATION_ID}>
                  Hailakandi Test Location
                </option>
              ) : (
                locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.location}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Rainfall 1 Day:{" "}
              <strong className="text-sky-700">{simForm.rainfall_1d} mm</strong>
            </label>

            <input
              type="range"
              min="0"
              max="300"
              step="1"
              value={simForm.rainfall_1d}
              onChange={(event) =>
                updateNumber("rainfall_1d", Number(event.target.value))
              }
              className="w-full accent-sky-600"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Rainfall 3 Days:{" "}
              <strong className="text-sky-700">{simForm.rainfall_3d} mm</strong>
            </label>

            <input
              type="range"
              min="0"
              max="500"
              step="1"
              value={simForm.rainfall_3d}
              onChange={(event) =>
                updateNumber("rainfall_3d", Number(event.target.value))
              }
              className="w-full accent-sky-600"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Rainfall 7 Days:{" "}
              <strong className="text-sky-700">{simForm.rainfall_7d} mm</strong>
            </label>

            <input
              type="range"
              min="0"
              max="800"
              step="1"
              value={simForm.rainfall_7d}
              onChange={(event) =>
                updateNumber("rainfall_7d", Number(event.target.value))
              }
              className="w-full accent-sky-600"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Rainfall 30 Days:{" "}
              <strong className="text-sky-700">
                {simForm.rainfall_30d} mm
              </strong>
            </label>

            <input
              type="range"
              min="0"
              max="1500"
              step="1"
              value={simForm.rainfall_30d}
              onChange={(event) =>
                updateNumber("rainfall_30d", Number(event.target.value))
              }
              className="w-full accent-sky-600"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Slope:{" "}
              <strong className="text-amber-700">
                {simForm.slope_degrees}°
              </strong>
            </label>

            <input
              type="range"
              min="0"
              max="70"
              step="1"
              value={simForm.slope_degrees}
              onChange={(event) =>
                updateNumber("slope_degrees", Number(event.target.value))
              }
              className="w-full accent-amber-600"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Elevation:{" "}
              <strong className="text-emerald-700">
                {simForm.elevation_m} m
              </strong>
            </label>

            <input
              type="range"
              min="0"
              max="3000"
              step="10"
              value={simForm.elevation_m}
              onChange={(event) =>
                updateNumber("elevation_m", Number(event.target.value))
              }
              className="w-full accent-emerald-600"
            />
          </div>

          <div className="md:col-span-3">
            <button
              type="submit"
              disabled={isSimulating}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {isSimulating
                ? "Computing XGBoost Prediction..."
                : "Run XGBoost Prediction"}
            </button>
          </div>
        </form>

        {simResult && (
          <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-sky-200">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3 mb-3">
              <div className="flex items-center gap-3">
                <RiskBadge
                  level={getDisplayRiskLevel(simResult.risk_level)}
                  size="sm"
                />

                <span className="text-sm font-bold text-slate-900">
                  Risk Score: {simResult.risk_score.toFixed(2)}/100
                </span>
              </div>

              <span className="text-xs font-semibold text-slate-500">
                Model: {simResult.model_version}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-white rounded-lg p-3 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  Risk Score
                </span>

                <p className="text-lg font-bold text-slate-900 mt-1">
                  {simResult.risk_score.toFixed(2)}
                </p>
              </div>

              <div className="bg-white rounded-lg p-3 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  Risk Level
                </span>

                <p className="text-lg font-bold text-slate-900 mt-1">
                  {simResult.risk_level}
                </p>
              </div>

              <div className="bg-white rounded-lg p-3 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  Model
                </span>

                <p className="text-sm font-bold text-slate-900 mt-1">
                  {simResult.model_version}
                </p>
              </div>
            </div>

            {simResult.explanation && simResult.explanation.length > 0 && (
              <div className="mt-4 text-xs text-slate-700">
                <strong>Model Explanation:</strong>

                <ul className="mt-2 list-disc pl-5 space-y-1">
                  {simResult.explanation.map((reason, index) => (
                    <li key={index}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}

            {simResult.alert_id && (
              <div className="mt-4 text-[11px] text-rose-900 bg-rose-50 p-3 rounded-lg border border-rose-200">
                <strong>Alert Generated:</strong> {simResult.alert_id}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 bg-slate-100/80 px-3 py-1.5 rounded-xl border border-slate-200 max-w-xs w-full text-xs">
          <Search className="h-4 w-4 text-slate-400" />

          <input
            type="text"
            placeholder="Search location, road, primary trigger..."
            value={tableSearch}
            onChange={(event) => setTableSearch(event.target.value)}
            className="w-full bg-transparent border-none focus:outline-none text-slate-800 placeholder-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl font-semibold">
            {["ALL", "Critical", "High", "Moderate", "Low"].map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setRiskFilter(level)}
                className={
                  riskFilter === level
                    ? "px-2.5 py-1 rounded-lg transition-colors bg-white text-slate-900 shadow-2xs"
                    : "px-2.5 py-1 rounded-lg transition-colors text-slate-600 hover:text-slate-900"
                }
              >
                {level}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl font-medium text-slate-600">
            <span>Prob &gt; {minProbability}%</span>

            <input
              type="range"
              min="0"
              max="90"
              step="10"
              value={minProbability}
              onChange={(event) =>
                setMinProbability(Number(event.target.value))
              }
              className="w-20 accent-slate-700"
            />
          </div>

          <select
            value={timeWindowFilter}
            onChange={(event) => setTimeWindowFilter(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Impact Windows</option>

            <option value="3-6 Hours">Immediate (&lt;6h)</option>

            <option value="12-24 Hours">Medium (12-24h)</option>

            <option value="&gt;48 Hours">Long Range (&gt;48h)</option>
          </select>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={8} />
      ) : filteredPredictions.length === 0 ? (
        <EmptyState
          title="No Matching Predictions"
          description="Try adjusting your probability threshold or risk filter to view other sectors."
          onReset={() => {
            setRiskFilter("ALL");
            setMinProbability(0);
            setTimeWindowFilter("ALL");
            setTableSearch("");
          }}
        />
      ) : (
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
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
                {filteredPredictions.map((location) => (
                  <tr
                    key={location.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div>{location.location}</div>

                      <div className="text-[11px] text-slate-500 font-normal">
                        {location.district ? `${location.district}, ` : ""}
                        {location.state}
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-center font-bold">
                      <span
                        className={
                          location.riskScore >= 80
                            ? "inline-block px-2.5 py-1 rounded-lg text-xs bg-rose-100 text-rose-800"
                            : location.riskScore >= 68
                              ? "inline-block px-2.5 py-1 rounded-lg text-xs bg-amber-100 text-amber-800"
                              : location.riskScore >= 50
                                ? "inline-block px-2.5 py-1 rounded-lg text-xs bg-yellow-100 text-yellow-800"
                                : "inline-block px-2.5 py-1 rounded-lg text-xs bg-emerald-100 text-emerald-800"
                        }
                      >
                        {location.riskScore}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-center font-semibold text-slate-800">
                      {location.probability}%
                    </td>

                    <td className="py-3.5 px-3 text-center font-medium text-slate-600">
                      {location.expectedWindow || "12-24h"}
                    </td>

                    <td className="py-3.5 px-3 text-center font-semibold text-sky-700">
                      {location.confidence}%
                    </td>

                    <td
                      className="py-3.5 px-4 text-slate-700 max-w-xs truncate"
                      title={location.primaryTrigger}
                    >
                      {location.primaryTrigger || "Monsoon slope surcharge"}
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <RiskBadge level={location.riskLevel} size="sm" />
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setDetailLocation(location)}
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

          <div className="md:hidden divide-y divide-slate-100 p-3 space-y-3">
            {filteredPredictions.map((location) => (
              <div
                key={location.id}
                className="p-3 rounded-xl bg-slate-50 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm">
                      {location.location}
                    </h5>

                    <p className="text-xs text-slate-500">
                      {location.district}, {location.state}
                    </p>
                  </div>

                  <RiskBadge level={location.riskLevel} size="sm" />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs py-1">
                  <div className="bg-white p-1.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">
                      Score
                    </span>

                    <strong className="text-slate-900">
                      {location.riskScore}
                    </strong>
                  </div>

                  <div className="bg-white p-1.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">
                      Prob.
                    </span>

                    <strong className="text-slate-900">
                      {location.probability}%
                    </strong>
                  </div>

                  <div className="bg-white p-1.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">
                      Confidence
                    </span>

                    <strong className="text-sky-700">
                      {location.confidence}%
                    </strong>
                  </div>
                </div>

                <p className="text-xs text-slate-600">
                  <strong>Trigger:</strong>{" "}
                  {location.primaryTrigger || "Monsoon slope surcharge"}
                </p>

                <button
                  type="button"
                  onClick={() => setDetailLocation(location)}
                  className="w-full py-2 rounded-lg bg-slate-900 text-white text-xs font-bold"
                >
                  View Full Trajectory
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <LocationDetailModal
        location={detailLocation}
        isOpen={!!detailLocation}
        onClose={() => setDetailLocation(null)}
      />
    </div>
  );
};

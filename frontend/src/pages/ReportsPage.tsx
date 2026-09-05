import React, { useState } from 'react';
import {
  FileBarChart,
  Download,
  Eye,
  Printer,
  Calendar,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { dataService } from '../services/dataService';
import type { ReportType, GeneratedReport } from '../types';
import { useToast } from '../context/ToastContext';
import { useFilters } from '../context/FilterContext';

export const ReportsPage: React.FC = () => {
  const { selectedState, selectedDistrict } = useFilters();
  const { showToast } = useToast();

  const [selectedType, setSelectedType] = useState<ReportType>('Daily');
  const [report, setReport] = useState<GeneratedReport | null>(null);
  const [generating, setGenerating] = useState<boolean>(false);
  const [previewOpen, setPreviewOpen] = useState<boolean>(false);

  const handleGenerate = async (type: ReportType = selectedType) => {
    setSelectedType(type);
    setGenerating(true);
    try {
      const generated = await dataService.generateReport(type, selectedDistrict || selectedState);
      setReport(generated);
      showToast(`${type} Report successfully synthesized`, 'success');
    } catch {
      showToast('Failed to generate report', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const reportTypes: { type: ReportType; label: string; desc: string }[] = [
    { type: 'Daily', label: 'Daily Situation Report (SITREP)', desc: '24-hour antecedent rainfall, current active alerts and slope conditions' },
    { type: 'Weekly', label: 'Weekly NER Hazard Forecast', desc: '7-day precipitation trajectory and regional road corridor status' },
    { type: 'Critical', label: 'Critical Incident Briefing', desc: 'Emergency dossier for immediate evacuation and NDRF battalion dispatch' },
    { type: 'District', label: 'District Vulnerability Assessment', desc: 'Detailed breakdown of local village ridges and critical municipal cuts' },
    { type: 'AI-Performance', label: 'AI Model Validation Audit', desc: 'Precision, recall, and false-positive evaluation vs ground truth' }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs">
            <FileBarChart className="h-6 w-6 text-sky-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 font-heading">
              Authoritative Situation Reports & Intelligence Dossiers
            </h3>
            <p className="text-xs text-slate-500">
              Generate standardized disaster briefings for State Disaster Management Authorities & Ministry of DoNER
            </p>
          </div>
        </div>

        {report && (
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors shadow-2xs"
            >
              <Printer className="h-4 w-4" />
              Print / Export PDF
            </button>
          </div>
        )}
      </div>

      {/* Select Report Template Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {reportTypes.map(rt => {
          const isSelected = selectedType === rt.type;
          return (
            <div
              key={rt.type}
              onClick={() => handleGenerate(rt.type)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between ${
                isSelected
                  ? 'border-sky-500 bg-sky-50/50 ring-1 ring-sky-300'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Format
                </span>
                <h4 className="font-bold text-xs text-slate-900 leading-snug">
                  {rt.label}
                </h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                  {rt.desc}
                </p>
              </div>

              <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className={`font-semibold ${isSelected ? 'text-sky-700' : 'text-slate-500'}`}>
                  {isSelected ? 'Active' : 'Generate'}
                </span>
                <Sparkles className={`h-3.5 w-3.5 ${isSelected ? 'text-sky-600' : 'text-slate-400'}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Report Document Workspace */}
      {generating ? (
        <div className="p-16 text-center rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="w-10 h-10 border-3 border-slate-300 border-t-sky-600 rounded-full animate-spin mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-800">Synthesizing Situation Intelligence...</h4>
          <p className="text-xs text-slate-400 mt-1">Aggregating telemetry from 18 NER sectors and GPM IMERG</p>
        </div>
      ) : report ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xs max-w-4xl mx-auto print:border-none print:shadow-none space-y-6">
          {/* Document Masthead */}
          <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Government of India &bull; Ministry of Development of North Eastern Region (MDoNER)
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 font-heading mt-1">
                {report.title}
              </h2>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                <span>Scope: <strong>{report.scope}</strong></span>
                <span>&bull;</span>
                <span>Generated: {report.generatedAt}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-900 text-white uppercase tracking-wider">
                Official SITREP
              </span>
              <p className="text-[10px] text-slate-400 mt-1">Ref: {report.id}</p>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              1. Executive Summary
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
              {report.summary}
            </p>
          </div>

          {/* Key Situation Metrics Grid */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              2. Key Operational Indicators
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 block text-[11px]">Critical Alerts</span>
                <strong className="text-lg text-rose-700">{report.keyMetrics.criticalAlertsCount}</strong>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 block text-[11px]">Active Hotspots</span>
                <strong className="text-lg text-amber-700">{report.keyMetrics.activeHotspotsCount}</strong>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 block text-[11px]">24h Mean Rain</span>
                <strong className="text-lg text-sky-700">{report.keyMetrics.avgRainfallMm} mm</strong>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 block text-[11px]">AI Precision</span>
                <strong className="text-lg text-emerald-700">{report.keyMetrics.aiModelAccuracy}</strong>
              </div>
            </div>
          </div>

          {/* Identified Critical Locations */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              3. Sectors Requiring Immediate Containment
            </h4>
            <ul className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
              {report.highRiskLocations.map((loc, i) => (
                <li key={i} className="p-3 flex items-center justify-between hover:bg-slate-50">
                  <span className="font-semibold text-slate-800">{loc}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                    High Vulnerability
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action Directives */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              4. Immediate Action Directives for Field Commanders
            </h4>
            <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 space-y-2 text-xs text-amber-950">
              {report.recommendedDirectives.map((dir, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="font-bold text-amber-800">{i + 1}.</span>
                  <span>{dir}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Signature Block */}
          <div className="border-t border-slate-200 pt-6 flex items-center justify-between text-xs text-slate-500">
            <div>
              <p className="font-bold text-slate-900">LANDSLIDE AI Automated Processing Core</p>
              <p>Common Alerting Protocol (CAP v1.2 / ITU-T X.1303 Compatible)</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-slate-900">Officer-in-Charge</p>
              <p>SDMA Disaster Response Division</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 shadow-xs">
          <FileText className="h-10 w-10 text-slate-300 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-800">Select a Report Template Above</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Click on any format (Daily SITREP, Weekly Forecast, Critical Briefing) to generate an authoritative briefing document.
          </p>
        </div>
      )}
    </div>
  );
};

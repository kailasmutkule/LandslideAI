import React, { useState } from 'react';
import { X, Send, Radio, ShieldAlert, CheckCircle2, MessageSquare } from 'lucide-react';
import type { Alert } from '../../types';
import { RiskBadge } from '../common/RiskBadge';

interface DispatchWarningModalProps {
  alert: Alert | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDispatch: (alertId: string, customMessage: string) => Promise<void>;
}

export const DispatchWarningModal: React.FC<DispatchWarningModalProps> = ({
  alert,
  isOpen,
  onClose,
  onConfirmDispatch
}) => {
  if (!isOpen || !alert) return null;

  const [customMessage, setCustomMessage] = useState<string>(
    alert.recommendedAction || 'Immediate landslide threat detected. Exercise extreme caution, avoid vulnerable slopes and follow SDMA evacuation directives.'
  );
  const [channels, setChannels] = useState({
    nationalPortal: true,
    smsBroadcast: true,
    ndrfSatcom: true,
    broHighway: true,
    sirenRelay: alert.severity === 'Critical'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onConfirmDispatch(alert.id, customMessage);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8 z-10 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between border-b border-slate-200/80 px-6 py-4 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-heading">
                CAP v1.2 Early Warning Dispatch
              </h3>
              <p className="text-xs text-slate-500">
                ITU-T X.1303 Common Alerting Protocol Relay
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Target Location Card */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 truncate">
                {alert.location || 'Target Location'}
              </span>
              <RiskBadge level={alert.severity} size="sm" />
            </div>
            <p className="text-xs text-slate-600">
              Trigger: {alert.triggerReason}
            </p>
          </div>

          {/* Broadcast Channels Selection */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">
              Authorized Distribution Channels
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={channels.nationalPortal}
                  onChange={e => setChannels(c => ({ ...c, nationalPortal: e.target.checked }))}
                  className="rounded text-sky-600 focus:ring-sky-500"
                />
                <span className="font-semibold text-slate-700">National NDMA Portal</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={channels.smsBroadcast}
                  onChange={e => setChannels(c => ({ ...c, smsBroadcast: e.target.checked }))}
                  className="rounded text-sky-600 focus:ring-sky-500"
                />
                <span className="font-semibold text-slate-700">Cell Broadcast SMS</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={channels.ndrfSatcom}
                  onChange={e => setChannels(c => ({ ...c, ndrfSatcom: e.target.checked }))}
                  className="rounded text-sky-600 focus:ring-sky-500"
                />
                <span className="font-semibold text-slate-700">NDRF SatCom Net</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={channels.broHighway}
                  onChange={e => setChannels(c => ({ ...c, broHighway: e.target.checked }))}
                  className="rounded text-sky-600 focus:ring-sky-500"
                />
                <span className="font-semibold text-slate-700">BRO Highway Patrol</span>
              </label>
            </div>
          </div>

          {/* Broadcast Message Customizer */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
              <span>Broadcast Directive (Plain Language)</span>
              <span className="text-[10px] text-slate-400 font-normal">Multilingual CAP field</span>
            </label>
            <textarea
              value={customMessage}
              onChange={e => setCustomMessage(e.target.value)}
              rows={3}
              required
              className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Operator Signature */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <span>Operator Identity: <strong>SDMA Duty Officer</strong></span>
            <span>Urgency: <strong>Immediate</strong></span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white hover:bg-rose-700 transition-colors shadow-sm disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              {isSubmitting ? 'Transmitting...' : 'Dispatch Authoritative Warning'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

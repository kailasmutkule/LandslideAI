import React, { useState } from 'react';
import { ShieldAlert, Lock, Mail, ArrowRight, CheckCircle2, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const LoginPage: React.FC<{ onLoginSuccess: () => void }> = ({ onLoginSuccess }) => {
  const { login } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('duty.officer@sdma.ner.gov.in');
  const [password, setPassword] = useState('••••••••••');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login({ email, password });
      showToast('Welcome back, Officer Pratham. Command link established.', 'success');
      onLoginSuccess();
    } catch {
      showToast('Authentication failed. Check credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoFill = () => {
    setEmail('command.officer@sdma.ner.gov.in');
    setPassword('LandslideAI2026!');
    showToast('Demo SDMA credentials auto-populated', 'info');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between items-center px-4 py-8">
      <div />

      {/* Login Card */}
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-xl shadow-slate-900/10 mb-4">
            <ShieldAlert className="h-9 w-9 text-sky-400" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-heading">
            LANDSLIDE AI
          </h1>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mt-1">
            North Eastern Region &bull; Landslide Early Warning System
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-sky-50 text-sky-800 border border-sky-200 mt-3">
            <Shield className="h-3 w-3 text-sky-600" />
            National Disaster Operations Gateway
          </div>
        </div>

        {/* Login Form */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                Official Government Email
              </label>
              <div className="relative">
                <Mail className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="officer@sdma.ner.gov.in"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Security Passcode
                </label>
                <span className="text-[11px] text-sky-600 hover:underline cursor-pointer">
                  Forgot key?
                </span>
              </div>
              <div className="relative">
                <Lock className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-xs font-bold text-white hover:bg-slate-800 transition-colors shadow-md shadow-slate-900/10 disabled:opacity-50"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In to Command Center'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>

          {/* Quick Demo Fill Button */}
          <div className="mt-5 pt-5 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={handleQuickDemoFill}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors inline-flex items-center gap-1.5 bg-slate-100/80 px-3 py-1.5 rounded-lg"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Quick-Fill Evaluator Credentials
            </button>
          </div>
        </div>
      </div>

      {/* Footer (Required by Section 3: "SIH 2026 Prototype" footer) */}
      <footer className="text-center text-xs text-slate-400 mt-8 space-y-1">
        <p className="font-semibold text-slate-600">
          SIH 2026 Prototype &bull; Problem Statement SIH26001
        </p>
        <p className="text-[11px]">
          Ministry of Development of North Eastern Region (MDoNER), Government of India
        </p>
      </footer>
    </div>
  );
};

import React, { useState } from 'react';
import { Pill, Lock, Mail, Key, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface LoginPageProps {
  onSuccess: () => void;
  navigate: (route: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess, navigate }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@medistockpro.com');
  const [password, setPassword] = useState('admin123456');
  const [role, setRole] = useState<UserRole>('Super Admin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password, role);
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoRole = (demoRole: UserRole, demoEmail: string) => {
    setRole(demoRole);
    setEmail(demoEmail);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/80 shadow-xl p-8 space-y-6 text-xs">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/25">
            <Pill className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">MediStock Pro Cloud</h2>
          <p className="text-slate-500 text-xs">Staff Authentication & Role-Based Access</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Staff Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-800 bg-slate-50"
            >
              <option value="Super Admin">Super Admin (Full Access)</option>
              <option value="Admin">Admin (Management & Stocks)</option>
              <option value="Manager">Manager (Operations & Purchasing)</option>
              <option value="Pharmacist">Pharmacist (POS, Dispensing & Batches)</option>
              <option value="Salesman">Salesman (POS Terminal Only)</option>
              <option value="Accountant">Accountant (Expenses & P&L)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@medistockpro.com"
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs transition-colors flex items-center justify-center space-x-2"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Workspace'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Role Selector */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-center">
            Instant Demo Account Presets:
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickDemoRole('Super Admin', 'admin@medistockpro.com')}
              className="py-1 px-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-semibold text-slate-700 text-center"
            >
              Super Admin
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoRole('Pharmacist', 'pharmacist@medistockpro.com')}
              className="py-1 px-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-semibold text-slate-700 text-center"
            >
              Pharmacist
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoRole('Salesman', 'salesman@medistockpro.com')}
              className="py-1 px-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-semibold text-slate-700 text-center"
            >
              Salesman
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoRole('Accountant', 'accountant@medistockpro.com')}
              className="py-1 px-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-semibold text-slate-700 text-center"
            >
              Accountant
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoRole('Manager', 'manager@medistockpro.com')}
              className="py-1 px-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-semibold text-slate-700 text-center"
            >
              Manager
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoRole('Admin', 'lead.admin@medistockpro.com')}
              className="py-1 px-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-semibold text-slate-700 text-center"
            >
              Admin
            </button>
          </div>
        </div>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            &larr; Back to Public Online Store
          </button>
        </div>
      </div>
    </div>
  );
};

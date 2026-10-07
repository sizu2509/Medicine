import React, { useState, useEffect } from 'react';
import { Database, CheckCircle2, AlertCircle, Copy, Check, RefreshCw, Key, ShieldCheck } from 'lucide-react';
import { Modal } from './Modal';
import { checkSupabaseConnection, setCustomSupabaseCredentials, DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY } from '../../lib/supabase';
import { db } from '../../services/db';

interface SupabaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseStatusModal: React.FC<SupabaseStatusModalProps> = ({ isOpen, onClose }) => {
  const [url, setUrl] = useState(() => localStorage.getItem('medistock_supabase_url') || import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL);
  const [key, setKey] = useState(() => localStorage.getItem('medistock_supabase_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY);
  const [status, setStatus] = useState<{ connected: boolean; message: string; hasTables?: boolean }>({
    connected: false,
    message: 'Checking connection...',
  });
  const [isTesting, setIsTesting] = useState(false);
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const testConnection = async () => {
    setIsTesting(true);
    const res = await checkSupabaseConnection();
    setStatus(res);
    setIsTesting(false);
  };

  useEffect(() => {
    if (isOpen) {
      testConnection();
    }
  }, [isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustomSupabaseCredentials(url, key);
    await testConnection();
  };

  const handleCopySchema = () => {
    // Schema code summary & instructions
    const notice = `-- Run the full schema located at supabase/schema.sql in your Supabase SQL Editor.
-- It provisions all tables (medicines, batches, sales, purchases, etc.), indexes, and RLS policies!`;
    navigator.clipboard.writeText(notice);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  const handleResetData = () => {
    if (window.confirm('Reset local pharmacy store to factory default seed data? All custom additions will be reverted.')) {
      db.resetToDefaults();
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 2000);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Database & Supabase Cloud Integration" maxWidth="2xl">
      <div className="space-y-6">
        {/* Status Card */}
        <div
          className={`p-4 rounded-xl border flex items-start space-x-3 ${
            status.connected
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              : 'bg-amber-50/70 border-amber-200 text-amber-900'
          }`}
        >
          {status.connected ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          )}
          <div className="text-xs">
            <h4 className="font-bold text-sm">
              {status.connected ? 'Connected to Supabase PostgreSQL' : 'Local Persistent Storage Mode Active'}
            </h4>
            <p className="mt-1 text-slate-600">{status.message}</p>
            <p className="mt-1 text-[11px] text-slate-500">
              MediStock Pro uses a dual-engine architecture: all CRUD, FEFO batches, sales, purchases, and receipts work seamlessly in both local reactive storage and live Supabase!
            </p>
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
            <Key className="w-3.5 h-3.5" />
            <span>Supabase Connection Settings</span>
          </h4>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Project URL (<code className="text-emerald-700">VITE_SUPABASE_URL</code>)
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://xyzcompany.supabase.co"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Anon Public API Key (<code className="text-emerald-700">VITE_SUPABASE_ANON_KEY</code>)
            </label>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Only use the anonymous public key (<code className="font-mono">anon</code>). Never use the service_role key.
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={testConnection}
              disabled={isTesting}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>Test Connection</span>
            </button>

            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
            >
              Save Credentials
            </button>
          </div>
        </form>

        {/* Database Quick Utilities */}
        <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div>
            <h5 className="text-xs font-bold text-slate-800">Database Schema & Seed</h5>
            <p className="text-[11px] text-slate-500">
              View or copy full SQL migration script for Supabase SQL Editor.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleCopySchema}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
            >
              {copiedSchema ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSchema ? 'SQL Path Copied!' : 'Copy Schema Info'}</span>
            </button>

            <button
              type="button"
              onClick={handleResetData}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-slate-200 rounded-lg transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{resetSuccess ? 'Reset Complete!' : 'Reset Demo Data'}</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

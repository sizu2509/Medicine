import React, { useState, useMemo } from 'react';
import {
  Activity,
  Clock,
  AlertTriangle,
  AlertOctagon,
  Search,
  Filter,
  Sliders,
  CheckCircle2,
  Calendar,
  Boxes,
  ShieldAlert,
} from 'lucide-react';
import { db, isExpired, getDaysUntilExpiry } from '../../services/db';
import { Batch } from '../../types';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../../components/common/Modal';

interface BatchesPageProps {
  initialFilter?: 'all' | 'expired' | '7days' | '30days' | '60days';
}

export const BatchesPage: React.FC<BatchesPageProps> = ({ initialFilter = 'all' }) => {
  const { formatCurrency, formatDate } = useSettings();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [expiryFilter, setExpiryFilter] = useState<'all' | 'expired' | '7days' | '30days' | '60days'>(
    initialFilter
  );

  const [batches, setBatches] = useState<Batch[]>(() => db.getBatches());
  const [selectedBatchForAdjustment, setSelectedBatchForAdjustment] = useState<Batch | null>(null);
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<
    'Damaged' | 'Expired' | 'Lost' | 'Physical Count Difference' | 'Other'
  >('Physical Count Difference');
  const [adjustNotes, setAdjustNotes] = useState('');
  const [adjustmentError, setAdjustmentError] = useState<string | null>(null);

  const refreshList = () => {
    setBatches(db.getBatches());
  };

  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      const matchSearch =
        b.batch_number.toLowerCase().includes(search.toLowerCase()) ||
        b.medicine_name?.toLowerCase().includes(search.toLowerCase()) ||
        b.supplier_name?.toLowerCase().includes(search.toLowerCase());

      const days = getDaysUntilExpiry(b.expiry_date);
      const expired = isExpired(b.expiry_date);

      let matchExpiry = true;
      if (expiryFilter === 'expired') {
        matchExpiry = expired && b.remaining_quantity > 0;
      } else if (expiryFilter === '7days') {
        matchExpiry = !expired && days <= 7 && b.remaining_quantity > 0;
      } else if (expiryFilter === '30days') {
        matchExpiry = !expired && days <= 30 && b.remaining_quantity > 0;
      } else if (expiryFilter === '60days') {
        matchExpiry = !expired && days <= 60 && b.remaining_quantity > 0;
      }

      return matchSearch && matchExpiry;
    });
  }, [batches, search, expiryFilter]);

  const handleOpenAdjustment = (batch: Batch) => {
    setSelectedBatchForAdjustment(batch);
    setAdjustQty(batch.remaining_quantity);
    setAdjustReason('Physical Count Difference');
    setAdjustNotes('');
    setAdjustmentError(null);
  };

  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchForAdjustment) return;

    if (adjustQty < 0) {
      setAdjustmentError('Quantity cannot be negative');
      return;
    }

    try {
      db.adjustStock({
        batch_id: selectedBatchForAdjustment.id,
        new_quantity: adjustQty,
        reason: adjustReason,
        notes: adjustNotes,
        user: user?.full_name || 'Pharmacist',
      });
      refreshList();
      setSelectedBatchForAdjustment(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setAdjustmentError(msg);
    }
  };

  // Expiry statistics
  const expiredCount = batches.filter((b) => b.remaining_quantity > 0 && isExpired(b.expiry_date)).length;
  const under30Count = batches.filter((b) => {
    const d = getDaysUntilExpiry(b.expiry_date);
    return b.remaining_quantity > 0 && d >= 0 && d <= 30;
  }).length;
  const under60Count = batches.filter((b) => {
    const d = getDaysUntilExpiry(b.expiry_date);
    return b.remaining_quantity > 0 && d >= 0 && d <= 60;
  }).length;

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Batch Inventory & FEFO Expiry Ledger</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Individual batch-level tracking with First-Expire, First-Out rule enforcement.
          </p>
        </div>

        {/* Stats counters */}
        <div className="flex items-center space-x-2 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-red-50 text-red-700 font-bold border border-red-200 flex items-center space-x-1.5">
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>{expiredCount} Expired (Locked)</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 font-bold border border-amber-200 flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>{under60Count} Expiring &le;60d</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by batch number, medicine name, supplier..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1 rounded-xl">
          {(
            [
              { id: 'all', label: 'All Batches' },
              { id: '60days', label: 'Expiring ≤60 Days' },
              { id: '30days', label: 'Expiring ≤30 Days' },
              { id: '7days', label: 'Expiring ≤7 Days' },
              { id: 'expired', label: 'Expired (Blocked)' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setExpiryFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                expiryFilter === tab.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Batches Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Batch Number</th>
                <th className="py-3 px-4">Medicine Name</th>
                <th className="py-3 px-4">Mfg Date</th>
                <th className="py-3 px-4">Expiry Date</th>
                <th className="py-3 px-4 text-right">Purchase Rate</th>
                <th className="py-3 px-4 text-right">Sale Rate</th>
                <th className="py-3 px-4 text-center">Remaining Stock</th>
                <th className="py-3 px-4 text-right">Stock Value</th>
                <th className="py-3 px-4 text-center">FEFO Status</th>
                <th className="py-3 px-4 text-right">Adjust</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No batches match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredBatches.map((batch) => {
                  const expired = isExpired(batch.expiry_date);
                  const days = getDaysUntilExpiry(batch.expiry_date);
                  const stockValue = batch.remaining_quantity * batch.purchase_price;

                  return (
                    <tr key={batch.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {batch.batch_number}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{batch.medicine_name}</div>
                        <div className="text-[10px] text-slate-400">{batch.supplier_name}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{formatDate(batch.mfg_date)}</td>
                      <td className="py-3 px-4 font-medium">
                        <span
                          className={`${
                            expired
                              ? 'text-red-700 font-bold'
                              : days <= 30
                              ? 'text-amber-700 font-bold'
                              : 'text-slate-700'
                          }`}
                        >
                          {formatDate(batch.expiry_date)}
                        </span>
                        <div className="text-[10px] text-slate-400">
                          {expired ? 'EXPIRED' : `${days} days left`}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600">
                        {formatCurrency(batch.purchase_price)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-emerald-700">
                        {formatCurrency(batch.sale_price)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-bold text-xs text-slate-800">
                          {batch.remaining_quantity}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          of {batch.quantity}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-800">
                        {formatCurrency(stockValue)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {expired ? (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                            Blocked (Expired)
                          </span>
                        ) : days <= 60 ? (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            Priority FEFO
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                            Valid
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenAdjustment(batch)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                          Audit Stock
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      <Modal
        isOpen={!!selectedBatchForAdjustment}
        onClose={() => setSelectedBatchForAdjustment(null)}
        title="Physical Stock Adjustment"
        subtitle={`Batch ${selectedBatchForAdjustment?.batch_number} - ${selectedBatchForAdjustment?.medicine_name}`}
        maxWidth="md"
      >
        {selectedBatchForAdjustment && (
          <form onSubmit={handleSaveAdjustment} className="space-y-4 text-xs">
            {adjustmentError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-medium">
                {adjustmentError}
              </div>
            )}

            <div className="bg-slate-50 p-3 rounded-xl space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Current Recorded Stock:</span>
                <span className="font-bold">{selectedBatchForAdjustment.remaining_quantity} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Expiry Date:</span>
                <span className="font-mono">{formatDate(selectedBatchForAdjustment.expiry_date)}</span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                New Actual Counted Quantity *
              </label>
              <input
                type="number"
                min="0"
                required
                value={adjustQty}
                onChange={(e) => setAdjustQty(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Difference:{' '}
                <strong
                  className={
                    adjustQty - selectedBatchForAdjustment.remaining_quantity < 0
                      ? 'text-rose-600'
                      : 'text-emerald-700'
                  }
                >
                  {adjustQty - selectedBatchForAdjustment.remaining_quantity >= 0 ? '+' : ''}
                  {adjustQty - selectedBatchForAdjustment.remaining_quantity} units
                </strong>
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Adjustment Reason *
              </label>
              <select
                value={adjustReason}
                onChange={(e) =>
                  setAdjustReason(
                    e.target.value as 'Damaged' | 'Expired' | 'Lost' | 'Physical Count Difference' | 'Other'
                  )
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Physical Count Difference">Physical Count Difference (Audit)</option>
                <option value="Damaged">Damaged Packaging / Broken ampoule</option>
                <option value="Expired">Expired stock removed</option>
                <option value="Lost">Lost / Pilferage</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Audit Notes</label>
              <textarea
                rows={2}
                value={adjustNotes}
                onChange={(e) => setAdjustNotes(e.target.value)}
                placeholder="Describe reason for count reconciliation..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedBatchForAdjustment(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors"
              >
                Commit Stock Adjustment
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

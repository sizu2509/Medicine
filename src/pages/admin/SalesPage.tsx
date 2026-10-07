import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Search,
  Printer,
  RotateCcw,
  Eye,
  Calendar,
  DollarSign,
  TrendingUp,
  User,
} from 'lucide-react';
import { db } from '../../services/db';
import { Sale, SalesReturn } from '../../types';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../../components/common/Modal';
import { ThermalReceipt } from '../../components/common/ThermalReceipt';

export const SalesPage: React.FC = () => {
  const { formatCurrency, formatDate } = useSettings();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [sales, setSales] = useState<Sale[]>(() => db.getSales());

  // Selected Sale for reprint/view
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  // Return Modal State
  const [saleForReturn, setSaleForReturn] = useState<Sale | null>(null);
  const [returnItemIdx, setReturnItemIdx] = useState<number>(0);
  const [returnQty, setReturnQty] = useState<number>(1);
  const [returnReason, setReturnReason] = useState('Patient recovered / Extra medicines');
  const [returnError, setReturnError] = useState<string | null>(null);

  const refreshList = () => {
    setSales(db.getSales());
  };

  const filteredSales = useMemo(() => {
    return sales.filter(
      (s) =>
        s.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
        s.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        s.cashier_name.toLowerCase().includes(search.toLowerCase())
    );
  }, [sales, search]);

  const totalSalesRevenue = filteredSales.reduce((acc, s) => acc + s.total, 0);
  const totalSalesProfit = filteredSales.reduce((acc, s) => acc + s.profit, 0);

  const handleOpenReturn = (sale: Sale) => {
    setSaleForReturn(sale);
    setReturnItemIdx(0);
    setReturnQty(1);
    setReturnError(null);
  };

  const handleExecuteSalesReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleForReturn) return;

    const item = saleForReturn.items[returnItemIdx];
    if (!item) return;

    if (returnQty <= 0 || returnQty > item.quantity) {
      setReturnError(`Return quantity must be between 1 and ${item.quantity}`);
      return;
    }

    try {
      const returnNumber = `SRET-${Date.now().toString().slice(-6)}`;
      const refundAmount = returnQty * item.unit_price;

      db.createSalesReturn({
        return_number: returnNumber,
        sale_id: saleForReturn.id,
        invoice_number: saleForReturn.invoice_number,
        return_date: new Date().toISOString().split('T')[0],
        refund_amount: refundAmount,
        reason: returnReason,
        items: [
          {
            medicine_id: item.medicine_id,
            medicine_name: item.medicine_name,
            batch_id: item.batch_id,
            batch_number: item.batch_number,
            return_qty: returnQty,
            refund_price: item.unit_price,
            total_refund: refundAmount,
          },
        ],
        created_by: user?.full_name || 'Pharmacist',
      });

      refreshList();
      setSaleForReturn(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setReturnError(msg);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header and Stats */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Sales Invoices & Cash Memos</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit dispensed medicines, customer returns, cashier receipts, and calculated profits.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
            <span className="text-[10px] font-bold text-emerald-800 uppercase block">Total Sales</span>
            <span className="text-base font-extrabold text-emerald-900">
              {formatCurrency(totalSalesRevenue)}
            </span>
          </div>
          <div className="p-3 bg-teal-50 rounded-xl border border-teal-100">
            <span className="text-[10px] font-bold text-teal-800 uppercase block">Net Profit</span>
            <span className="text-base font-extrabold text-teal-900">
              {formatCurrency(totalSalesProfit)}
            </span>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice number (e.g. MS-123456), customer name, cashier..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Sales Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4 text-right">Subtotal</th>
                <th className="py-3 px-4 text-right">Discount</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-right">Batch Profit</th>
                <th className="py-3 px-4">Cashier</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No sales invoices recorded yet.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {sale.invoice_number}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{sale.customer_name}</div>
                      {sale.customer_phone && (
                        <div className="text-[10px] text-slate-400">{sale.customer_phone}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{formatDate(sale.sale_date)}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {sale.payment_method}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600">
                      {formatCurrency(sale.subtotal)}
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-600">
                      {sale.discount > 0 ? `-${formatCurrency(sale.discount)}` : '0.00'}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {formatCurrency(sale.total)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-teal-700">
                      {formatCurrency(sale.profit)}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{sale.cashier_name}</td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        type="button"
                        onClick={() => setSelectedSale(sale)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors inline-flex items-center space-x-1"
                      >
                        <Printer className="w-3 h-3" />
                        <span>Print Receipt</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenReturn(sale)}
                        className="px-2 py-1 text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                      >
                        Return
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Thermal & A4 Receipt Modal */}
      <Modal
        isOpen={!!selectedSale}
        onClose={() => setSelectedSale(null)}
        title="Print Sales Memo / Invoice"
        maxWidth="2xl"
      >
        {selectedSale && <ThermalReceipt sale={selectedSale} />}
      </Modal>

      {/* Customer Return Modal */}
      <Modal
        isOpen={!!saleForReturn}
        onClose={() => setSaleForReturn(null)}
        title="Customer Sales Return"
        subtitle={`Invoice: ${saleForReturn?.invoice_number}`}
        maxWidth="md"
      >
        {saleForReturn && (
          <form onSubmit={handleExecuteSalesReturn} className="space-y-4 text-xs">
            {returnError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-medium">
                {returnError}
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Select Item to Return
              </label>
              <select
                value={returnItemIdx}
                onChange={(e) => setReturnItemIdx(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl"
              >
                {saleForReturn.items.map((it, idx) => (
                  <option key={idx} value={idx}>
                    {it.medicine_name} [Batch: {it.batch_number}] (Sold: {it.quantity})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Return Quantity (Max: {saleForReturn.items[returnItemIdx]?.quantity})
              </label>
              <input
                type="number"
                min="1"
                max={saleForReturn.items[returnItemIdx]?.quantity}
                value={returnQty}
                onChange={(e) => setReturnQty(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Return Reason</label>
              <select
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl"
              >
                <option value="Patient recovered / Extra medicines">
                  Patient recovered / Extra medicines
                </option>
                <option value="Doctor changed prescription">Doctor changed prescription</option>
                <option value="Wrong medicine purchased">Wrong medicine purchased</option>
                <option value="Damaged seal upon opening">Damaged seal upon opening</option>
              </select>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl flex justify-between font-bold">
              <span>Customer Refund Amount:</span>
              <span className="text-emerald-800">
                {formatCurrency(
                  returnQty * (saleForReturn.items[returnItemIdx]?.unit_price || 0)
                )}
              </span>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSaleForReturn(null)}
                className="px-4 py-2 bg-slate-100 rounded-xl font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold"
              >
                Accept Return & Restore Stock
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

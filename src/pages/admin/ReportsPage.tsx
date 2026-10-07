import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  FileSpreadsheet,
  Filter,
  TrendingUp,
  Package,
} from 'lucide-react';
import { db } from '../../services/db';
import { useSettings } from '../../context/SettingsContext';

export const ReportsPage: React.FC = () => {
  const { formatCurrency, formatDate } = useSettings();
  const [reportType, setReportType] = useState<
    'sales' | 'purchases' | 'inventory' | 'batches' | 'profit'
  >('sales');

  const sales = useMemo(() => db.getSales(), []);
  const purchases = useMemo(() => db.getPurchases(), []);
  const medicines = useMemo(() => db.getMedicines(), []);
  const batches = useMemo(() => db.getBatches(), []);

  const handlePrint = () => window.print();

  const handleDownloadCSV = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let filename = `medistock-report-${reportType}.csv`;

    if (reportType === 'sales') {
      headers = ['Invoice No', 'Date', 'Customer', 'Payment Method', 'Total (BDT)', 'Profit (BDT)', 'Cashier'];
      rows = sales.map((s) => [
        s.invoice_number,
        s.sale_date,
        `"${s.customer_name}"`,
        s.payment_method,
        s.total,
        s.profit,
        `"${s.cashier_name}"`,
      ]);
    } else if (reportType === 'purchases') {
      headers = ['PO Number', 'Invoice No', 'Date', 'Supplier', 'Payment Type', 'Total (BDT)', 'Paid (BDT)', 'Due (BDT)'];
      rows = purchases.map((p) => [
        p.purchase_number,
        p.invoice_number,
        p.purchase_date,
        `"${p.supplier_name || ''}"`,
        p.payment_type,
        p.total,
        p.paid_amount,
        p.due_amount,
      ]);
    } else if (reportType === 'inventory') {
      headers = ['Medicine Name', 'Brand', 'Generic', 'Dosage Form', 'Total Stock', 'Purchase Rate', 'Sale Rate', 'Stock Value'];
      rows = medicines.map((m) => [
        `"${m.name}"`,
        `"${m.brand_name}"`,
        `"${m.generic_name || ''}"`,
        m.dosage_form,
        m.total_stock || 0,
        m.purchase_price,
        m.sale_price,
        (m.total_stock || 0) * m.purchase_price,
      ]);
    } else if (reportType === 'batches') {
      headers = ['Batch No', 'Medicine Name', 'Mfg Date', 'Expiry Date', 'Remaining Qty', 'Purchase Rate', 'Sale Rate'];
      rows = batches.map((b) => [
        b.batch_number,
        `"${b.medicine_name || ''}"`,
        b.mfg_date,
        b.expiry_date,
        b.remaining_quantity,
        b.purchase_price,
        b.sale_price,
      ]);
    }

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
  };

  return (
    <div className="space-y-5">
      {/* Header and Toolbar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Business Analytics & Audited Reports</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Export comprehensive reports for management, taxation, and regulatory compliance.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadCSV}
            className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV / Excel</span>
          </button>
        </div>
      </div>

      {/* Report Selector Tabs */}
      <div className="flex flex-wrap gap-2 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        {(
          [
            { id: 'sales', label: 'Sales & Revenue Report' },
            { id: 'purchases', label: 'Supplier Procurement Report' },
            { id: 'inventory', label: 'Stock Valuation Report' },
            { id: 'batches', label: 'FEFO Batch Ledger Report' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setReportType(tab.id)}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${
              reportType === tab.id
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Render Active Table Report */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          {reportType === 'sales' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4 text-right">Net Total</th>
                  <th className="py-3 px-4 text-right">Batch Profit</th>
                  <th className="py-3 px-4">Dispenser</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 font-mono font-bold">{s.invoice_number}</td>
                    <td className="py-2.5 px-4 text-slate-600">{formatDate(s.sale_date)}</td>
                    <td className="py-2.5 px-4 font-medium">{s.customer_name}</td>
                    <td className="py-2.5 px-4">{s.payment_method}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                      {formatCurrency(s.total)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-teal-700">
                      {formatCurrency(s.profit)}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500">{s.cashier_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'purchases' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase">
                <tr>
                  <th className="py-3 px-4">PO #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-right">Paid</th>
                  <th className="py-3 px-4 text-right">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchases.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 font-mono font-bold">{p.purchase_number}</td>
                    <td className="py-2.5 px-4 text-slate-600">{formatDate(p.purchase_date)}</td>
                    <td className="py-2.5 px-4 font-semibold">{p.supplier_name}</td>
                    <td className="py-2.5 px-4 font-mono text-slate-600">{p.invoice_number}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                      {formatCurrency(p.total)}
                    </td>
                    <td className="py-2.5 px-4 text-right text-emerald-700">
                      {formatCurrency(p.paid_amount)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-rose-600">
                      {formatCurrency(p.due_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'inventory' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase">
                <tr>
                  <th className="py-3 px-4">Medicine Name</th>
                  <th className="py-3 px-4">Form</th>
                  <th className="py-3 px-4">Total Stock</th>
                  <th className="py-3 px-4 text-right">Purchase Rate</th>
                  <th className="py-3 px-4 text-right">Sale Rate</th>
                  <th className="py-3 px-4 text-right">Total Stock Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {medicines.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 font-semibold">{m.name}</td>
                    <td className="py-2.5 px-4 text-slate-600">{m.dosage_form}</td>
                    <td className="py-2.5 px-4 font-bold">
                      {m.total_stock} {m.unit}
                    </td>
                    <td className="py-2.5 px-4 text-right">{formatCurrency(m.purchase_price)}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-emerald-700">
                      {formatCurrency(m.sale_price)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                      {formatCurrency((m.total_stock || 0) * m.purchase_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'batches' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase">
                <tr>
                  <th className="py-3 px-4">Batch Number</th>
                  <th className="py-3 px-4">Medicine Name</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4 text-center">Remaining</th>
                  <th className="py-3 px-4 text-right">Acquisition Rate</th>
                  <th className="py-3 px-4 text-right">Remaining Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 font-mono font-bold">{b.batch_number}</td>
                    <td className="py-2.5 px-4 font-semibold">{b.medicine_name}</td>
                    <td className="py-2.5 px-4 font-mono">{formatDate(b.expiry_date)}</td>
                    <td className="py-2.5 px-4 text-center font-bold">{b.remaining_quantity}</td>
                    <td className="py-2.5 px-4 text-right">{formatCurrency(b.purchase_price)}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                      {formatCurrency(b.remaining_quantity * b.purchase_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

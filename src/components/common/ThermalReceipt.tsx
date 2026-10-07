import React, { useState } from 'react';
import { Printer, Download, Check, FileText } from 'lucide-react';
import { Sale } from '../../types';
import { useSettings } from '../../context/SettingsContext';

interface ThermalReceiptProps {
  sale: Sale;
  onClose?: () => void;
}

export const ThermalReceipt: React.FC<ThermalReceiptProps> = ({ sale, onClose }) => {
  const { settings, formatCurrency, formatDate } = useSettings();
  const [format, setFormat] = useState<'80mm' | 'A4'>('80mm');
  const [copied, setCopied] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const copyTextReceipt = () => {
    const lines = [
      `==============================`,
      settings.pharmacy_name,
      settings.address,
      `Phone: ${settings.phone}`,
      `==============================`,
      `Invoice #: ${sale.invoice_number}`,
      `Date: ${formatDate(sale.sale_date)}`,
      `Cashier: ${sale.cashier_name}`,
      `Customer: ${sale.customer_name}`,
      `------------------------------`,
      ...sale.items.map(
        (i) => `${i.medicine_name} [${i.batch_number}]\n  ${i.quantity} x ${i.unit_price} = ${i.total}`
      ),
      `------------------------------`,
      `Subtotal: ${sale.subtotal}`,
      `Discount: -${sale.discount}`,
      `VAT (${settings.tax_rate}%): +${sale.tax}`,
      `TOTAL: ${sale.total}`,
      `Paid: ${sale.paid_amount}`,
      `Due: ${sale.due_amount}`,
      `==============================`,
      `Thank you for choosing us!`,
      `Get well soon!`,
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Format Toggle & Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 no-print">
        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setFormat('80mm')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              format === '80mm' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Thermal Receipt (80mm)
          </button>
          <button
            type="button"
            onClick={() => setFormat('A4')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              format === 'A4' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Standard A4 Invoice
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={copyTextReceipt}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <FileText className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Text'}</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Invoice</span>
          </button>
        </div>
      </div>

      {/* Printable Area */}
      <div id="printable-area" className="flex justify-center bg-slate-50 p-2 sm:p-4 rounded-xl">
        {format === '80mm' ? (
          /* Thermal 80mm Layout */
          <div className="w-[320px] bg-white p-5 border border-slate-200 rounded-lg shadow-xs text-slate-800 font-mono text-[11px] leading-relaxed">
            {/* Header */}
            <div className="text-center pb-3 border-b border-dashed border-slate-300">
              <div className="inline-block p-1 bg-emerald-100 text-emerald-800 rounded-md font-sans font-bold text-xs mb-1">
                MediStock Pro
              </div>
              <h2 className="font-bold text-sm text-slate-900 uppercase font-sans tracking-tight">
                {settings.pharmacy_name}
              </h2>
              <p className="text-[10px] text-slate-600">{settings.address}</p>
              <p className="text-[10px] text-slate-600">Hotline: {settings.phone}</p>
              <div className="mt-1 text-[9px] bg-slate-100 inline-block px-2 py-0.5 rounded font-sans text-slate-500">
                BIN/VAT Reg: 002349182-0102
              </div>
            </div>

            {/* Meta */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-0.5 text-[10px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice:</span>
                <span className="font-bold">{sale.invoice_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span>{formatDate(sale.sale_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="truncate max-w-[170px] font-medium">{sale.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cashier:</span>
                <span>{sale.cashier_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment:</span>
                <span className="font-bold uppercase text-emerald-700">{sale.payment_method}</span>
              </div>
            </div>

            {/* Items Table */}
            <div className="py-2.5 border-b border-dashed border-slate-300">
              <div className="flex justify-between font-bold border-b border-slate-200 pb-1 mb-1 text-[10px]">
                <span className="w-1/2">Item [Batch]</span>
                <span className="w-1/4 text-center">Qty x Rate</span>
                <span className="w-1/4 text-right">Total</span>
              </div>
              {sale.items.map((item, idx) => (
                <div key={idx} className="py-1">
                  <div className="font-semibold text-slate-900 truncate">
                    {item.medicine_name}
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span className="text-[9px]">
                      B:{item.batch_number} Exp:{formatDate(item.expiry_date)}
                    </span>
                    <span>
                      {item.quantity} x {item.unit_price}
                    </span>
                    <span className="font-semibold text-slate-800">
                      {formatCurrency(item.total)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-right text-[11px]">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>{formatCurrency(sale.subtotal)}</span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount:</span>
                  <span>-{formatCurrency(sale.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>VAT ({settings.tax_rate}%):</span>
                <span>+{formatCurrency(sale.tax)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-slate-900 pt-1 border-t border-slate-200">
                <span>NET TOTAL:</span>
                <span>{formatCurrency(sale.total)}</span>
              </div>
              <div className="flex justify-between text-slate-700 pt-0.5">
                <span>Paid Amount:</span>
                <span>{formatCurrency(sale.paid_amount)}</span>
              </div>
              {sale.due_amount > 0 && (
                <div className="flex justify-between text-rose-600 font-bold">
                  <span>Due Balance:</span>
                  <span>{formatCurrency(sale.due_amount)}</span>
                </div>
              )}
            </div>

            {/* Barcode & Footer */}
            <div className="pt-3 text-center space-y-1.5">
              {/* Fake visual barcode stripes */}
              <div className="flex justify-center items-center space-x-0.5 py-1">
                {[4, 2, 6, 2, 8, 3, 5, 2, 7, 2, 4, 3, 6, 2, 8, 4, 3, 5].map((h, i) => (
                  <div
                    key={i}
                    className="bg-slate-900 w-[2px]"
                    style={{ height: `${16 + (h % 8)}px` }}
                  />
                ))}
              </div>
              <p className="text-[9px] tracking-widest text-slate-500 font-mono">
                *{sale.invoice_number}*
              </p>
              <p className="text-[10px] font-sans font-medium text-slate-700">
                Thank you for your visit! Wishing you speedy recovery.
              </p>
              <p className="text-[9px] text-slate-400 font-sans">
                Medicines cannot be returned without original cash memo within 7 days.
              </p>
            </div>
          </div>
        ) : (
          /* A4 Invoice Layout */
          <div className="w-full max-w-[650px] bg-white p-8 border border-slate-200 rounded-lg shadow-xs text-slate-800 text-xs">
            {/* Top Branding */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-5 mb-5">
              <div>
                <h1 className="text-xl font-bold text-emerald-800">{settings.pharmacy_name}</h1>
                <p className="text-slate-500 text-xs">{settings.tagline}</p>
                <p className="text-slate-600 text-xs mt-1">{settings.address}</p>
                <p className="text-slate-600 text-xs">Phone: {settings.phone} | Email: {settings.email}</p>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg uppercase tracking-wider text-xs">
                  Tax Invoice / Cash Memo
                </span>
                <p className="font-bold text-sm text-slate-900 mt-2">{sale.invoice_number}</p>
                <p className="text-slate-500 text-xs">Date: {formatDate(sale.sale_date)}</p>
              </div>
            </div>

            {/* Bill To */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl mb-5">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Bill To Customer:</span>
                <p className="font-bold text-sm text-slate-800">{sale.customer_name}</p>
                {sale.customer_phone && <p className="text-slate-600">Phone: {sale.customer_phone}</p>}
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400">Payment Details:</span>
                <p className="font-semibold text-slate-800">Method: {sale.payment_method}</p>
                <p className="text-slate-600">Dispensed by: {sale.cashier_name}</p>
              </div>
            </div>

            {/* Table */}
            <table className="w-full text-left border-collapse mb-5">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100 text-slate-700">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Medicine Name</th>
                  <th className="py-2.5 px-3">Batch</th>
                  <th className="py-2.5 px-3">Expiry</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sale.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 text-slate-400">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{item.medicine_name}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{item.batch_number}</td>
                    <td className="py-2.5 px-3 text-slate-600">{formatDate(item.expiry_date)}</td>
                    <td className="py-2.5 px-3 text-center font-bold">{item.quantity}</td>
                    <td className="py-2.5 px-3 text-right">{formatCurrency(item.unit_price)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Summary */}
            <div className="flex justify-end border-t border-slate-200 pt-4">
              <div className="w-64 space-y-1.5 text-right">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold">{formatCurrency(sale.subtotal)}</span>
                </div>
                {sale.discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount:</span>
                    <span>-{formatCurrency(sale.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>VAT ({settings.tax_rate}%):</span>
                  <span>+{formatCurrency(sale.tax)}</span>
                </div>
                <div className="flex justify-between font-bold text-base text-slate-900 border-t border-slate-200 pt-2">
                  <span>Net Payable:</span>
                  <span className="text-emerald-700">{formatCurrency(sale.total)}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Paid:</span>
                  <span>{formatCurrency(sale.paid_amount)}</span>
                </div>
                {sale.due_amount > 0 && (
                  <div className="flex justify-between text-rose-600 font-bold">
                    <span>Due:</span>
                    <span>{formatCurrency(sale.due_amount)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-4 border-t border-slate-200 text-center text-slate-500 text-[11px]">
              <p>Registered Pharmacist: Verified & Dispensed according to DGDA regulations.</p>
              <p className="mt-0.5">Computer-generated commercial invoice by MediStock Pro.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

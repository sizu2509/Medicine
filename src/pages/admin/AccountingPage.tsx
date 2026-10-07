import React, { useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileSpreadsheet,
  Receipt,
  ShoppingCart,
  RotateCcw,
  Scale,
  Calendar,
} from 'lucide-react';
import { db } from '../../services/db';
import { useSettings } from '../../context/SettingsContext';

export const AccountingPage: React.FC = () => {
  const { formatCurrency, formatDate } = useSettings();

  const sales = useMemo(() => db.getSales(), []);
  const purchases = useMemo(() => db.getPurchases(), []);
  const expenses = useMemo(() => db.getExpenses(), []);
  const customers = useMemo(() => db.getCustomers(), []);
  const suppliers = useMemo(() => db.getSuppliers(), []);

  // Accounting calculations
  const grossSales = sales.reduce((sum, s) => sum + s.subtotal, 0);
  const salesDiscounts = sales.reduce((sum, s) => sum + s.discount, 0);
  const netSales = grossSales - salesDiscounts;

  // COGS = Cost of Goods Sold (Sum of actual batch purchase price * sold quantity)
  const cogs = sales.reduce((sum, s) => {
    const itemCost = s.items.reduce(
      (iSum, item) => iSum + (item.purchase_price || 0) * item.quantity,
      0
    );
    return sum + itemCost;
  }, 0);

  const grossProfit = netSales - cogs;
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = grossProfit - totalExpenses;

  // Total Outstandings
  const customerReceivables = customers.reduce((sum, c) => sum + (c.due_amount || 0), 0);
  const supplierPayables = suppliers.reduce((sum, s) => sum + (s.current_balance || 0), 0);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <h1 className="text-lg font-bold text-slate-800">Pharmacy Accounting & Profit & Loss Statement</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time audited income, cost of goods sold (COGS via FEFO batches), and net business profitability.
        </p>
      </div>

      {/* Main Income Statement Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-2">
            <Scale className="w-5 h-5 text-emerald-600" />
            <h2 className="font-bold text-slate-900 text-base">Statement of Financial Performance (P&L)</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">Fiscal Year 2026</span>
        </div>

        <div className="space-y-3 text-xs divide-y divide-slate-100">
          {/* Revenue */}
          <div className="pt-2 flex justify-between items-center text-slate-700">
            <span className="font-semibold">Gross Medicine Sales</span>
            <span className="font-mono text-sm">{formatCurrency(grossSales)}</span>
          </div>
          <div className="pt-2 flex justify-between items-center text-rose-600">
            <span>Less: Customer Discounts</span>
            <span className="font-mono text-sm">-{formatCurrency(salesDiscounts)}</span>
          </div>
          <div className="pt-3 flex justify-between items-center font-bold text-slate-900 bg-slate-50 p-3 rounded-xl">
            <span className="text-sm">NET SALES REVENUE</span>
            <span className="font-mono text-base text-emerald-800">{formatCurrency(netSales)}</span>
          </div>

          {/* Cost of Goods Sold */}
          <div className="pt-3 flex justify-between items-center text-slate-700">
            <div>
              <span className="font-semibold block">Cost of Goods Sold (COGS)</span>
              <span className="text-[10px] text-slate-400">
                Exact acquisition cost per batch dispensed (FEFO audited)
              </span>
            </div>
            <span className="font-mono text-sm text-slate-900">-{formatCurrency(cogs)}</span>
          </div>

          {/* Gross Profit */}
          <div className="pt-3 flex justify-between items-center font-bold text-slate-900 bg-emerald-50/60 p-3 rounded-xl border border-emerald-100">
            <div>
              <span className="text-sm text-emerald-950">GROSS PROFIT</span>
              <span className="text-[10px] text-emerald-700 block font-normal">
                Margin: {netSales > 0 ? ((grossProfit / netSales) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <span className="font-mono text-lg text-emerald-800">{formatCurrency(grossProfit)}</span>
          </div>

          {/* Operating Expenses */}
          <div className="pt-3 flex justify-between items-center text-slate-700">
            <div>
              <span className="font-semibold block">Operating Expenses (OPEX)</span>
              <span className="text-[10px] text-slate-400">Rent, Utilities, Salaries, Logistics</span>
            </div>
            <span className="font-mono text-sm text-rose-600">-{formatCurrency(totalExpenses)}</span>
          </div>

          {/* Net Profit */}
          <div className="pt-4 flex justify-between items-center font-extrabold text-white bg-slate-900 p-4 rounded-xl shadow-md">
            <div>
              <span className="text-base tracking-wide">NET OPERATING PROFIT</span>
              <span className="text-[10px] text-slate-400 block font-normal">
                Final bottom line after all cost deductions
              </span>
            </div>
            <span className="font-mono text-xl text-emerald-400">{formatCurrency(netProfit)}</span>
          </div>
        </div>
      </div>

      {/* Balance Sheet Balances (Receivables & Payables) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Accounts Receivable (Customer Due)
            </span>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900">
            {formatCurrency(customerReceivables)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Pending payments from regular patients</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Accounts Payable (Supplier Due)
            </span>
            <div className="p-2 bg-rose-50 text-rose-700 rounded-xl">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900">
            {formatCurrency(supplierPayables)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Outstanding distributor credit to pay</p>
        </div>
      </div>
    </div>
  );
};

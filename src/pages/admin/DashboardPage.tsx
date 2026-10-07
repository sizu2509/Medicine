import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  ShoppingBag,
  ShoppingCart,
  Boxes,
  AlertTriangle,
  Clock,
  Users,
  Truck,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Calendar,
  AlertOctagon,
  ChevronRight,
} from 'lucide-react';
import { db } from '../../services/db';
import { useSettings } from '../../context/SettingsContext';
import { isExpired, getDaysUntilExpiry } from '../../services/db';

interface DashboardPageProps {
  onNavigateTab: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigateTab }) => {
  const { formatCurrency, formatDate } = useSettings();
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'year'>('month');

  const medicines = useMemo(() => db.getMedicines(), []);
  const batches = useMemo(() => db.getBatches(), []);
  const sales = useMemo(() => db.getSales(), []);
  const purchases = useMemo(() => db.getPurchases(), []);
  const customers = useMemo(() => db.getCustomers(), []);
  const suppliers = useMemo(() => db.getSuppliers(), []);
  const orders = useMemo(() => db.getOrders(), []);

  // Compute stock value & stock quantities
  const totalStockQuantity = batches.reduce((acc, b) => acc + (b.remaining_quantity || 0), 0);
  const totalStockValue = batches.reduce(
    (acc, b) => acc + (b.remaining_quantity || 0) * b.purchase_price,
    0
  );

  // Compute Expiry metrics
  const expiredBatches = batches.filter((b) => b.remaining_quantity > 0 && isExpired(b.expiry_date));
  const expiringSoonBatches = batches.filter((b) => {
    const days = getDaysUntilExpiry(b.expiry_date);
    return b.remaining_quantity > 0 && days >= 0 && days <= 60;
  });

  // Low Stock
  const lowStockMedicines = medicines.filter(
    (m) => (m.total_stock || 0) <= m.reorder_level
  );

  // Filter Sales & Purchases by selected date filter
  const filteredSales = useMemo(() => {
    const now = new Date();
    return sales.filter((s) => {
      const saleDate = new Date(s.sale_date);
      if (dateFilter === 'today') {
        return saleDate.toDateString() === now.toDateString();
      }
      if (dateFilter === 'week') {
        const diff = (now.getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24);
        return diff <= 7;
      }
      if (dateFilter === 'month') {
        return (
          saleDate.getMonth() === now.getMonth() &&
          saleDate.getFullYear() === now.getFullYear()
        );
      }
      return saleDate.getFullYear() === now.getFullYear();
    });
  }, [sales, dateFilter]);

  const totalSalesAmount = filteredSales.reduce((acc, s) => acc + s.total, 0);
  const totalProfitAmount = filteredSales.reduce((acc, s) => acc + s.profit, 0);
  const totalPurchasesAmount = purchases.reduce((acc, p) => acc + p.total, 0);

  // Outstanding Dues
  const totalCustomerDue = customers.reduce((acc, c) => acc + (c.due_amount || 0), 0);
  const totalSupplierDue = suppliers.reduce((acc, s) => acc + (s.current_balance || 0), 0);

  // Top selling products computation
  const topSelling = useMemo(() => {
    const map: Record<string, { name: string; qty: number; revenue: number }> = {};
    sales.forEach((s) => {
      s.items.forEach((i) => {
        if (!map[i.medicine_id]) {
          map[i.medicine_id] = { name: i.medicine_name, qty: 0, revenue: 0 };
        }
        map[i.medicine_id].qty += i.quantity;
        map[i.medicine_id].revenue += i.total;
      });
    });
    return Object.values(map)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [sales]);

  return (
    <div className="space-y-6">
      {/* Welcome & Date Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Pharmacy Operations Overview</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time tracking of sales, FEFO batches, inventory value, and critical health alerts.
          </p>
        </div>

        {/* Date Filter Tabs */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
          {(['today', 'week', 'month', 'year'] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setDateFilter(filter)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                dateFilter === filter
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {filter === 'today'
                ? 'Today'
                : filter === 'week'
                ? 'This Week'
                : filter === 'month'
                ? 'This Month'
                : 'This Year'}
            </button>
          ))}
        </div>
      </div>

      {/* Main KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Sales */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {dateFilter === 'today' ? "Today's Sales" : 'Period Sales'}
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-extrabold text-slate-900">
              {formatCurrency(totalSalesAmount)}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{filteredSales.length} invoices generated</p>
        </div>

        {/* Profit */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Period Profit
            </span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-extrabold text-teal-700">
              {formatCurrency(totalProfitAmount)}
            </span>
          </div>
          <p className="text-[11px] text-teal-600 font-medium mt-1">
            Exact batch FEFO margin calculated
          </p>
        </div>

        {/* Stock Valuation */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Stock Valuation
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-extrabold text-slate-900">
              {formatCurrency(totalStockValue)}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {totalStockQuantity.toLocaleString()} total units across {medicines.length} products
          </p>
        </div>

        {/* Pending Due Receivables / Payables */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Pending Dues
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-extrabold text-amber-900">
              {formatCurrency(totalCustomerDue)}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Supplier due: {formatCurrency(totalSupplierDue)}
          </p>
        </div>
      </div>

      {/* Critical Health Alerts (Low stock & Expiry) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Low Stock Warning */}
        <div
          onClick={() => onNavigateTab('low-stock')}
          className="bg-rose-50/70 border border-rose-200/80 p-4 rounded-2xl cursor-pointer hover:bg-rose-50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-rose-800">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <span className="font-bold text-sm">Low Stock Medicines</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-600 text-white">
              {lowStockMedicines.length}
            </span>
          </div>
          <p className="text-xs text-rose-700 mt-2">
            Items currently at or below their configured reorder thresholds.
          </p>
          <div className="mt-3 flex items-center text-xs font-bold text-rose-800">
            <span>Review & Order Now</span>
            <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </div>

        {/* Expiring Soon */}
        <div
          onClick={() => onNavigateTab('expiry')}
          className="bg-amber-50/70 border border-amber-200/80 p-4 rounded-2xl cursor-pointer hover:bg-amber-50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-amber-800">
              <Clock className="w-5 h-5 text-amber-600" />
              <span className="font-bold text-sm">Near Expiry (&le; 60 Days)</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-600 text-white">
              {expiringSoonBatches.length}
            </span>
          </div>
          <p className="text-xs text-amber-700 mt-2">
            Batches expiring within the next 2 months. Prioritize via FEFO!
          </p>
          <div className="mt-3 flex items-center text-xs font-bold text-amber-800">
            <span>View Expiry Tracker</span>
            <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </div>

        {/* Expired Batches (Sale Blocked!) */}
        <div
          onClick={() => onNavigateTab('expiry')}
          className="bg-red-50/80 border border-red-300 p-4 rounded-2xl cursor-pointer hover:bg-red-50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-red-900">
              <AlertOctagon className="w-5 h-5 text-red-600" />
              <span className="font-bold text-sm">Expired Batches (Blocked)</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white">
              {expiredBatches.length}
            </span>
          </div>
          <p className="text-xs text-red-800 mt-2">
            Batches strictly prohibited from POS sale. Requires disposal or return.
          </p>
          <div className="mt-3 flex items-center text-xs font-bold text-red-900">
            <span>Quarantine & Adjust</span>
            <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </div>
      </div>

      {/* Middle Section: Top Selling Medicines & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Selling Medicines */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Top Selling Pharmaceuticals</h3>
              <p className="text-xs text-slate-500">Highest volume medicines sold this month</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('reports')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
            >
              Detailed Sales Report &rarr;
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-2.5">Medicine</th>
                  <th className="py-2.5 text-center">Units Sold</th>
                  <th className="py-2.5 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topSelling.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-slate-400">
                      No sales recorded yet.
                    </td>
                  </tr>
                ) : (
                  topSelling.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-3 font-semibold text-slate-800 flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[10px]">
                          {idx + 1}
                        </span>
                        <span>{item.name}</span>
                      </td>
                      <td className="py-3 text-center font-bold text-slate-700">{item.qty}</td>
                      <td className="py-3 text-right font-bold text-emerald-700">
                        {formatCurrency(item.revenue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Operational Shortcuts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-sm mb-1">Fast Navigation</h3>
            <p className="text-xs text-slate-500 mb-4">Direct shortcuts to daily pharmacy operations</p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => onNavigateTab('pos')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs shadow-emerald-600/30"
              >
                <div className="flex items-center space-x-2">
                  <ShoppingBag className="w-4 h-4" />
                  <span>Start New POS Sale</span>
                </div>
                <span className="text-[10px] bg-emerald-700 px-1.5 py-0.5 rounded">F2</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('purchases')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <ShoppingCart className="w-4 h-4 text-slate-600" />
                  <span>New Purchase Inward</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('inventory')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Boxes className="w-4 h-4 text-slate-600" />
                  <span>Check Current Inventory</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('prescriptions')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-slate-600" />
                  <span>Customer Prescriptions & Orders</span>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                  {orders.length}
                </span>
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>MediStock Cloud Node: ACTIVE</span>
            <span>FEFO Enforced</span>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Pill,
  Tags,
  Layers,
  Truck,
  Users,
  ShoppingCart,
  RotateCcw,
  Boxes,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  Receipt,
  DollarSign,
  BarChart3,
  UserCheck,
  ShieldAlert,
  Settings as SettingsIcon,
  Activity,
  Menu,
  X,
  Bell,
  Search,
  ExternalLink,
  LogOut,
  Database,
  ChevronDown,
  Sparkles,
  ShoppingBag,
  Image,
} from 'lucide-react';
import { useAuth, PermissionKey } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { db, subscribeToDB } from '../services/db';
import { UserRole, Notification } from '../types';
import { SupabaseStatusModal } from '../components/common/SupabaseStatusModal';

interface AdminLayoutProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onNavigatePublic: () => void;
  children: React.ReactNode;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  permission?: PermissionKey;
  badge?: number;
  badgeColor?: string;
  group: 'Overview' | 'Medicines & Stock' | 'Sales & POS' | 'Procurement' | 'Accounting' | 'Admin';
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  setCurrentTab,
  onNavigatePublic,
  children,
}) => {
  const { user, role, switchRole, logout, canAccess } = useAuth();
  const { settings } = useSettings();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showDbModal, setShowDbModal] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(() => db.getNotifications());
  const [counts, setCounts] = useState({
    lowStock: 0,
    expiring: 0,
    orders: 0,
  });

  const refreshBadges = () => {
    const meds = db.getMedicines();
    const batches = db.getBatches();
    const orders = db.getOrders();
    const notifs = db.getNotifications();

    const lowCount = meds.filter((m) => (m.total_stock || 0) <= m.reorder_level).length;
    const now = new Date();
    const expCount = batches.filter((b) => {
      const exp = new Date(b.expiry_date);
      const diff = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return b.remaining_quantity > 0 && diff <= 60;
    }).length;
    const pendingOrders = orders.filter((o) => o.status === 'Pending').length;

    setCounts({ lowStock: lowCount, expiring: expCount, orders: pendingOrders });
    setNotifications(notifs);
  };

  useEffect(() => {
    refreshBadges();
    const unsubscribe = subscribeToDB(refreshBadges);
    return unsubscribe;
  }, []);

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'Overview' },
    { id: 'media-notices', label: 'Media & Notices', icon: Image, group: 'Overview' },
    { id: 'pos', label: 'POS Terminal', icon: ShoppingBag, permission: 'manage_sales', group: 'Sales & POS' },
    { id: 'sales', label: 'Sales & Invoices', icon: Receipt, permission: 'manage_sales', group: 'Sales & POS' },
    { id: 'sales-returns', label: 'Sales Returns', icon: RotateCcw, permission: 'manage_returns', group: 'Sales & POS' },
    { id: 'prescriptions', label: 'Prescriptions & Rx', icon: FileSpreadsheet, permission: 'manage_sales', group: 'Sales & POS', badge: counts.orders, badgeColor: 'bg-emerald-500' },

    { id: 'medicines', label: 'Medicines Master', icon: Pill, permission: 'manage_medicines', group: 'Medicines & Stock' },
    { id: 'categories', label: 'Categories', icon: Tags, permission: 'manage_categories', group: 'Medicines & Stock' },
    { id: 'generics', label: 'Generics', icon: Layers, permission: 'manage_generics', group: 'Medicines & Stock' },
    { id: 'inventory', label: 'Stock Inventory', icon: Boxes, permission: 'manage_inventory', group: 'Medicines & Stock' },
    { id: 'batches', label: 'Batch Records', icon: Activity, permission: 'manage_inventory', group: 'Medicines & Stock' },
    { id: 'expiry', label: 'Expiry Tracker', icon: Clock, permission: 'manage_inventory', group: 'Medicines & Stock', badge: counts.expiring, badgeColor: 'bg-amber-500' },
    { id: 'low-stock', label: 'Low Stock Alerts', icon: AlertTriangle, permission: 'manage_inventory', group: 'Medicines & Stock', badge: counts.lowStock, badgeColor: 'bg-rose-500' },

    { id: 'purchases', label: 'Purchase Invoices', icon: ShoppingCart, permission: 'manage_purchases', group: 'Procurement' },
    { id: 'purchase-returns', label: 'Purchase Returns', icon: RotateCcw, permission: 'manage_purchases', group: 'Procurement' },
    { id: 'suppliers', label: 'Suppliers Master', icon: Truck, permission: 'manage_purchases', group: 'Procurement' },
    { id: 'customers', label: 'Customers Master', icon: Users, permission: 'manage_sales', group: 'Procurement' },

    { id: 'expenses', label: 'Expense Tracker', icon: DollarSign, permission: 'manage_expenses', group: 'Accounting' },
    { id: 'accounts', label: 'Accounting & P&L', icon: DollarSign, permission: 'manage_accounts', group: 'Accounting' },
    { id: 'reports', label: 'Reports & Exports', icon: BarChart3, permission: 'view_reports', group: 'Accounting' },

    { id: 'users', label: 'Staff Users & Roles', icon: UserCheck, permission: 'manage_users', group: 'Admin' },
    { id: 'settings', label: 'Pharmacy Settings', icon: SettingsIcon, permission: 'manage_settings', group: 'Admin' },
    { id: 'audit-logs', label: 'Audit Trail Ledger', icon: ShieldAlert, permission: 'view_audit_logs', group: 'Admin' },
  ];

  // Filter items accessible by the current role
  const allowedNavItems = navItems.filter(
    (item) => !item.permission || canAccess(item.permission)
  );

  const groups: Array<NavItem['group']> = [
    'Overview',
    'Sales & POS',
    'Medicines & Stock',
    'Procurement',
    'Accounting',
    'Admin',
  ];

  const unreadNotifs = notifications.filter((n) => !n.read).length;

  const roles: UserRole[] = [
    'Super Admin',
    'Admin',
    'Manager',
    'Pharmacist',
    'Salesman',
    'Accountant',
  ];

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-xs backdrop-blur-md">
        <div className="flex items-center justify-between px-3 sm:px-6 h-16">
          {/* Left: Mobile hamburger & Brand */}
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div
              onClick={() => setCurrentTab('dashboard')}
              className="flex items-center space-x-2.5 cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20">
                <Pill className="w-5 h-5" />
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center space-x-1.5">
                  <span className="font-extrabold text-base tracking-tight text-slate-900">
                    MediStock
                  </span>
                  <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded uppercase">
                    PRO
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium truncate max-w-[170px]">
                  {settings.pharmacy_name}
                </p>
              </div>
            </div>
          </div>

          {/* Center: Fast POS Shortcut */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setCurrentTab('pos')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all shadow-xs ${
                currentTab === 'pos'
                  ? 'bg-emerald-600 text-white shadow-emerald-500/25 ring-2 ring-emerald-600/20'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Open POS</span>
              <span className="hidden md:inline-block text-[10px] bg-emerald-200/60 text-emerald-900 px-1 rounded font-mono">
                F2
              </span>
            </button>

            <button
              type="button"
              onClick={onNavigatePublic}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Public Store</span>
            </button>
          </div>

          {/* Right: DB Status, Role Switcher, Notifications & Profile */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Database connector button */}
            <button
              type="button"
              onClick={() => setShowDbModal(true)}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              title="Click to view Supabase Cloud status or paste credentials"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden md:inline">Supabase</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </button>

            {/* Quick Role Switcher (Crucial for testing all 6 RBAC roles in AI Studio!) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition-colors"
              >
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span className="max-w-[75px] truncate">{role}</span>
                <ChevronDown className="w-3 h-3 text-amber-700" />
              </button>

              {showRoleMenu && (
                <div
                  className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
                  onClick={() => setShowRoleMenu(false)}
                >
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Switch Test Role:
                  </div>
                  {roles.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => switchRole(r)}
                      className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between ${
                        role === r
                          ? 'bg-amber-50 text-amber-900 font-bold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{r}</span>
                      {role === r && <span className="text-[10px] text-amber-600">Active</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifs > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500"></span>
                )}
              </button>

              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-800">Notifications</span>
                    <button
                      type="button"
                      onClick={() => {
                        db.markAllNotificationsRead();
                        setNotifications(db.getNotifications());
                      }}
                      className="text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-center text-xs text-slate-400">No new notifications</p>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => {
                            db.markNotificationRead(notif.id);
                            if (notif.link) {
                              const tabName = notif.link.replace('/admin/', '');
                              setCurrentTab(tabName);
                            }
                            setShowNotifMenu(false);
                          }}
                          className={`p-3 text-xs hover:bg-slate-50 cursor-pointer transition-colors ${
                            notif.read ? 'opacity-60' : 'bg-emerald-50/30'
                          }`}
                        >
                          <div className="font-semibold text-slate-800">{notif.title}</div>
                          <p className="text-[11px] text-slate-600 mt-0.5">{notif.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User profile & logout */}
            <div className="flex items-center pl-1 sm:pl-2 border-l border-slate-200">
              <button
                type="button"
                onClick={logout}
                title="Sign Out"
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-900/40 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Role pill indicator */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800 truncate max-w-[160px]">
                  {user?.full_name || 'Staff User'}
                </p>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wide">
                    {role}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto p-3 space-y-6">
            {groups.map((group) => {
              const items = allowedNavItems.filter((i) => i.group === group);
              if (items.length === 0) return null;
              return (
                <div key={group} className="space-y-1">
                  <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {group}
                  </div>
                  {items.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setCurrentTab(item.id);
                          setSidebarOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-emerald-600 text-white font-bold shadow-xs shadow-emerald-600/30'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge !== undefined && item.badge > 0 && (
                          <span
                            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold text-white ${
                              item.badgeColor || 'bg-slate-500'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Bottom system status info */}
          <div className="p-3 border-t border-slate-100 bg-slate-50 text-[11px] text-slate-500 flex items-center justify-between">
            <span className="font-mono">v2.4.0 (Cloud)</span>
            <span className="font-semibold text-emerald-700">Online</span>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">{children}</div>
        </main>
      </div>

      {/* Supabase connection modal */}
      <SupabaseStatusModal isOpen={showDbModal} onClose={() => setShowDbModal(false)} />
    </div>
  );
};

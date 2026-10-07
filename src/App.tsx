/**
 * MediStock Pro - Production Cloud Pharmacy & Medical Store Management System
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { CartProvider } from './context/CartContext';

// Layouts
import { AdminLayout } from './layouts/AdminLayout';
import { PublicLayout } from './layouts/PublicLayout';

// Admin Pages
import { DashboardPage } from './pages/admin/DashboardPage';
import { POSPage } from './pages/admin/POSPage';
import { MedicinesPage } from './pages/admin/MedicinesPage';
import { BatchesPage } from './pages/admin/BatchesPage';
import { PurchasesPage } from './pages/admin/PurchasesPage';
import { SalesPage } from './pages/admin/SalesPage';
import { CategoriesPage } from './pages/admin/CategoriesPage';
import { GenericsPage } from './pages/admin/GenericsPage';
import { SuppliersPage } from './pages/admin/SuppliersPage';
import { CustomersPage } from './pages/admin/CustomersPage';
import { AccountingPage } from './pages/admin/AccountingPage';
import { ExpensesPage } from './pages/admin/ExpensesPage';
import { PrescriptionsPage } from './pages/admin/PrescriptionsPage';
import { ReportsPage } from './pages/admin/ReportsPage';
import { SettingsPage } from './pages/admin/SettingsPage';
import { AuditLogsPage } from './pages/admin/AuditLogsPage';
import { UsersPage } from './pages/admin/UsersPage';

// Public Pages
import { HomePage } from './pages/public/HomePage';
import { MedicinesCatalogPage } from './pages/public/MedicinesCatalogPage';
import { CartPage } from './pages/public/CartPage';
import { CheckoutPage } from './pages/public/CheckoutPage';
import { OrderSuccessPage } from './pages/public/OrderSuccessPage';
import { AboutPage, ContactPage } from './pages/public/AboutContactPages';
import { LoginPage } from './pages/public/LoginPage';

function MainApp() {
  const { isAuthenticated } = useAuth();

  // Route state: default to 'admin' mode for immediate management view or 'public' for customer experience
  const [viewMode, setViewMode] = useState<'admin' | 'public'>('admin');
  const [adminTab, setAdminTab] = useState('dashboard');
  const [publicRoute, setPublicRoute] = useState('/');
  const [lastOrderNumber, setLastOrderNumber] = useState('');

  // Handle URL hashtag or search param synchronization
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash.startsWith('/admin')) {
        setViewMode('admin');
        const tab = hash.replace('/admin/', '').replace('/admin', '');
        setAdminTab(tab || 'dashboard');
      } else if (hash.startsWith('/')) {
        setViewMode('public');
        setPublicRoute(hash);
      }
    };
    if (window.location.hash) {
      handleHash();
    }
  }, []);

  const navigatePublic = (route: string) => {
    setViewMode('public');
    setPublicRoute(route);
    window.location.hash = route;
  };

  const navigateAdmin = (tab = 'dashboard') => {
    setViewMode('admin');
    setAdminTab(tab);
    window.location.hash = `/admin/${tab}`;
  };

  // Render Admin Content
  const renderAdminContent = () => {
    switch (adminTab) {
      case 'dashboard':
        return <DashboardPage onNavigateTab={setAdminTab} />;
      case 'pos':
        return <POSPage />;
      case 'medicines':
        return <MedicinesPage />;
      case 'categories':
        return <CategoriesPage />;
      case 'generics':
        return <GenericsPage />;
      case 'inventory':
      case 'batches':
        return <BatchesPage initialFilter="all" />;
      case 'expiry':
        return <BatchesPage initialFilter="60days" />;
      case 'low-stock':
        return <MedicinesPage />;
      case 'purchases':
      case 'purchase-returns':
        return <PurchasesPage />;
      case 'sales':
      case 'sales-returns':
        return <SalesPage />;
      case 'suppliers':
        return <SuppliersPage />;
      case 'customers':
        return <CustomersPage />;
      case 'prescriptions':
        return <PrescriptionsPage />;
      case 'expenses':
        return <ExpensesPage />;
      case 'accounts':
        return <AccountingPage />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage />;
      case 'audit-logs':
        return <AuditLogsPage />;
      case 'users':
      case 'roles':
        return <UsersPage />;
      default:
        return <DashboardPage onNavigateTab={setAdminTab} />;
    }
  };

  // Render Public Content
  const renderPublicContent = () => {
    if (publicRoute === '/cart') {
      return <CartPage navigate={navigatePublic} />;
    }
    if (publicRoute === '/checkout') {
      return (
        <CheckoutPage
          navigate={navigatePublic}
          setLastOrderNumber={setLastOrderNumber}
        />
      );
    }
    if (publicRoute === '/order-success') {
      return (
        <OrderSuccessPage
          orderNumber={lastOrderNumber}
          navigate={navigatePublic}
        />
      );
    }
    if (publicRoute.startsWith('/medicines')) {
      return <MedicinesCatalogPage />;
    }
    if (publicRoute === '/about') {
      return <AboutPage />;
    }
    if (publicRoute === '/contact') {
      return <ContactPage />;
    }
    if (publicRoute === '/login') {
      return (
        <LoginPage
          onSuccess={() => navigateAdmin('dashboard')}
          navigate={navigatePublic}
        />
      );
    }
    return <HomePage navigate={navigatePublic} />;
  };

  if (viewMode === 'admin') {
    return (
      <AdminLayout
        currentTab={adminTab}
        setCurrentTab={navigateAdmin}
        onNavigatePublic={() => navigatePublic('/')}
      >
        {renderAdminContent()}
      </AdminLayout>
    );
  }

  return (
    <PublicLayout
      currentRoute={publicRoute}
      navigate={navigatePublic}
      onOpenAdmin={() => navigateAdmin('dashboard')}
    >
      {renderPublicContent()}
    </PublicLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <CartProvider>
          <MainApp />
        </CartProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

import React, { useState } from 'react';
import {
  Pill,
  ShoppingCart,
  Search,
  Phone,
  Clock,
  MapPin,
  ShieldCheck,
  Lock,
  Menu,
  X,
  Heart,
  ChevronRight,
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useCart } from '../context/CartContext';

interface PublicLayoutProps {
  currentRoute: string;
  navigate: (route: string) => void;
  onOpenAdmin: () => void;
  children: React.ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({
  currentRoute,
  navigate,
  onOpenAdmin,
  children,
}) => {
  const { settings, formatCurrency } = useSettings();
  const { totalItems } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Home', route: '/' },
    { label: 'Medicines', route: '/medicines' },
    { label: 'About Us', route: '/about' },
    { label: 'Contact', route: '/contact' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Top Notification Strip */}
      <div className="bg-emerald-950 text-emerald-200 text-xs py-2 px-4 border-b border-emerald-900">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1 text-[11px]">
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Hotline: {settings.phone}</span>
            </span>
            <span className="hidden md:inline">&bull;</span>
            <span className="hidden md:flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>24/7 Pharmacist Support & Doorstep Delivery</span>
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-emerald-400 font-semibold">DGDA Licensed Model Pharmacy</span>
            <button
              type="button"
              onClick={onOpenAdmin}
              className="px-2.5 py-0.5 rounded bg-emerald-800 hover:bg-emerald-700 text-white font-bold transition-colors flex items-center space-x-1"
            >
              <Lock className="w-3 h-3" />
              <span>Staff Login</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          {/* Logo & Brand */}
          <div
            onClick={() => navigate('/')}
            className="flex items-center space-x-2.5 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/25">
              <Pill className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-lg tracking-tight text-slate-900">
                  MediStock
                </span>
                <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded uppercase">
                  Care
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">{settings.tagline}</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6 text-xs font-semibold">
            {navLinks.map((link) => (
              <button
                key={link.route}
                type="button"
                onClick={() => navigate(link.route)}
                className={`transition-colors py-1 ${
                  currentRoute === link.route
                    ? 'text-emerald-600 border-b-2 border-emerald-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Cart & Staff Actions */}
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => navigate('/cart')}
              className="relative p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center space-x-1.5"
            >
              <ShoppingCart className="w-5 h-5 text-emerald-700" />
              <span className="hidden sm:inline text-xs font-bold">Cart</span>
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white shadow-xs">
                  {totalItems}
                </span>
              )}
            </button>

            {/* Mobile menu trigger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 space-y-2">
            {navLinks.map((link) => (
              <button
                key={link.route}
                type="button"
                onClick={() => {
                  navigate(link.route);
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 text-xs font-semibold text-slate-700 hover:text-emerald-600"
              >
                {link.label}
              </button>
            ))}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  onOpenAdmin();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2 text-xs font-bold text-emerald-700 text-left flex items-center space-x-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Go to Staff Application</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs pt-12 pb-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center space-x-2 text-white mb-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
                <Pill className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-base">{settings.pharmacy_name}</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">{settings.tagline}</p>
            <p className="mt-3 text-[11px] text-slate-500">{settings.address}</p>
          </div>

          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button type="button" onClick={() => navigate('/medicines')} className="hover:text-emerald-400">
                  Medicines Catalog
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate('/about')} className="hover:text-emerald-400">
                  About Our Pharmacy
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate('/contact')} className="hover:text-emerald-400">
                  Contact & Prescriptions
                </button>
              </li>
              <li>
                <button type="button" onClick={onOpenAdmin} className="hover:text-emerald-400">
                  Pharmacy Staff Portal
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">
              Certified Safety & Standards
            </h4>
            <p className="text-slate-400 text-[11px] leading-relaxed mb-3">
              We strictly adhere to Directorate General of Drug Administration (DGDA) protocols. Expired or unsealed medicines are never sold.
            </p>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded bg-slate-800 text-emerald-400 text-[11px] font-semibold border border-slate-700">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>100% Genuine Pharmaceuticals</span>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">
              Payment Methods Accepted
            </h4>
            <p className="text-[11px] text-slate-400 mb-2">
              Cash on delivery, bKash, Nagad, Rocket, VISA, and Mastercard.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {['Cash', 'bKash', 'Nagad', 'Rocket', 'VISA', 'Mastercard'].map((p) => (
                <span
                  key={p}
                  className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono border border-slate-700"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 border-t border-slate-800 text-center text-slate-500 text-[11px]">
          &copy; {new Date().getFullYear()} {settings.pharmacy_name}. All rights reserved. Powered by MediStock Pro Cloud.
        </div>
      </footer>
    </div>
  );
};

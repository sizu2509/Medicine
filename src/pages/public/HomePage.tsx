import React, { useState } from 'react';
import {
  Search,
  Pill,
  ShieldCheck,
  Truck,
  Clock,
  Sparkles,
  ArrowRight,
  Upload,
  Plus,
  Check,
} from 'lucide-react';
import { db } from '../../services/db';
import { Medicine } from '../../types';
import { useSettings } from '../../context/SettingsContext';
import { useCart } from '../../context/CartContext';

interface HomePageProps {
  navigate: (route: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ navigate }) => {
  const { formatCurrency } = useSettings();
  const { addToCart } = useCart();
  const [search, setSearch] = useState('');
  const [addedId, setAddedId] = useState<string | null>(null);

  const medicines = db.getMedicines();
  const categories = db.getCategories();

  const handleAdd = (med: Medicine) => {
    addToCart(med, 1);
    setAddedId(med.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/medicines?q=${encodeURIComponent(search.trim())}`);
    } else {
      navigate('/medicines');
    }
  };

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-emerald-900 via-emerald-850 to-slate-900 text-white py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-800/80 text-emerald-200 text-xs font-semibold border border-emerald-700/50">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>Digital Pharmacy & Instant Prescription Delivery</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Order Genuine Medicines with <br className="hidden sm:inline" />
            <span className="text-emerald-400">Certified FEFO Freshness</span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Fast, regulated doorstep delivery across Dhaka and all Bangladesh. Over-the-counter and prescription medicines dispensed by registered pharmacists.
          </p>

          {/* Big Search Bar */}
          <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto">
            <div className="relative flex items-center bg-white rounded-2xl p-2 shadow-2xl">
              <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by brand name or generic (e.g. Napa Extra, Seclo, Ciprocin)..."
                className="w-full px-3 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs sm:text-sm shrink-0 transition-colors shadow-xs"
              >
                Find Medicine
              </button>
            </div>
          </form>

          {/* Upload Prescription Button */}
          <div className="pt-2 flex justify-center">
            <button
              type="button"
              onClick={() => navigate('/medicines')}
              className="inline-flex items-center space-x-2 text-xs text-emerald-300 hover:text-white underline font-medium"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Have a doctor's prescription? Browse catalog and upload at checkout</span>
            </button>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-start space-x-4">
            <div className="p-3 bg-emerald-100 text-emerald-800 rounded-2xl shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800">100% Genuine Pharmaceuticals</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Direct procurement from Square, Beximco, Incepta, and top licensed manufacturers.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-start space-x-4">
            <div className="p-3 bg-teal-100 text-teal-800 rounded-2xl shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800">FEFO Expiry Protection</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Automatic First-Expire, First-Out batch routing guarantees fresh shelf life with zero expired stock.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-start space-x-4">
            <div className="p-3 bg-blue-100 text-blue-800 rounded-2xl shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800">Express Delivery</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Fast temperature-controlled courier delivery right to your door within hours.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Shop by Medical Category</h2>
            <p className="text-xs text-slate-500">Therapeutic remedies formulated for common ailments</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/medicines')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {categories.slice(0, 10).map((cat) => (
            <div
              key={cat.id}
              onClick={() => navigate(`/medicines?category=${cat.id}`)}
              className="p-4 bg-white hover:bg-emerald-50/70 border border-slate-200/80 hover:border-emerald-200 rounded-2xl cursor-pointer transition-all text-center space-y-1.5 shadow-xs"
            >
              <div className="w-10 h-10 mx-auto rounded-xl bg-slate-100 flex items-center justify-center text-emerald-700">
                <Pill className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-xs text-slate-800 truncate">{cat.name}</h4>
              <p className="text-[10px] text-slate-400 line-clamp-1">{cat.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Medicines Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Featured Healthcare Products</h2>
            <p className="text-xs text-slate-500">Most requested essential medicines in store</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/medicines')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
          >
            Browse Full Catalog &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {medicines.slice(0, 8).map((med) => {
            const stock = med.total_stock || 0;
            const isOutOfStock = stock <= 0;

            return (
              <div
                key={med.id}
                className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3 hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded">
                      {med.dosage_form}
                    </span>
                    {med.prescription_required && (
                      <span className="text-[9px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.5 rounded">
                        Rx Required
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-sm text-slate-800 mt-2">{med.name}</h3>
                  <p className="text-[11px] text-emerald-700 font-medium">{med.generic_name}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {med.manufacturer} &bull; {med.pack_size}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Retail Price</span>
                    <span className="font-extrabold text-sm text-slate-900">
                      {formatCurrency(med.sale_price)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAdd(med)}
                    disabled={isOutOfStock}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1 ${
                      isOutOfStock
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : addedId === med.id
                        ? 'bg-teal-600 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {addedId === med.id ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Added</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

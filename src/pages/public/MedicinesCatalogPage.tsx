import React, { useState, useMemo } from 'react';
import { Search, Filter, Pill, Plus, Check, AlertCircle, Layers } from 'lucide-react';
import { db } from '../../services/db';
import { Medicine, DosageForm } from '../../types';
import { useSettings } from '../../context/SettingsContext';
import { useCart } from '../../context/CartContext';

interface MedicinesCatalogPageProps {
  initialSearch?: string;
  initialCategory?: string;
}

export const MedicinesCatalogPage: React.FC<MedicinesCatalogPageProps> = ({
  initialSearch = '',
  initialCategory = 'all',
}) => {
  const { formatCurrency } = useSettings();
  const { addToCart } = useCart();

  const [search, setSearch] = useState(initialSearch);
  const [selectedCat, setSelectedCat] = useState(initialCategory);
  const [selectedGenericId, setSelectedGenericId] = useState('all');
  const [addedId, setAddedId] = useState<string | null>(null);

  const medicines = useMemo(() => db.getMedicines(), []);
  const categories = useMemo(() => db.getCategories(), []);
  const generics = useMemo(() => db.getGenerics(), []);

  const filteredMedicines = useMemo(() => {
    return medicines.filter((m) => {
      const matchSearch =
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.generic_name?.toLowerCase().includes(search.toLowerCase()) ||
        m.brand_name.toLowerCase().includes(search.toLowerCase());

      const matchCat = selectedCat === 'all' || m.category_id === selectedCat;
      const matchGen = selectedGenericId === 'all' || m.generic_id === selectedGenericId;

      return matchSearch && matchCat && matchGen;
    });
  }, [medicines, search, selectedCat, selectedGenericId]);

  const handleAdd = (med: Medicine) => {
    addToCart(med, 1);
    setAddedId(med.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Medicines & Healthcare Catalog</h1>
        <p className="text-xs text-slate-500 mt-1">
          Explore genuine pharmaceutical formulations, brand alternatives, and retail pricing.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by brand name or generic (e.g. Napa, Seclo, Metformin)..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedGenericId}
            onChange={(e) => setSelectedGenericId(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Generic Molecules</option>
            {generics.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Count & Generic Filter Notice */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Showing {filteredMedicines.length} medicine formulations</span>
        {selectedGenericId !== 'all' && (
          <button
            type="button"
            onClick={() => setSelectedGenericId('all')}
            className="text-emerald-700 font-bold hover:underline"
          >
            Clear Generic Filter &times;
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredMedicines.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            No medicines matched your criteria. Try adjusting the search keywords or filters.
          </div>
        ) : (
          filteredMedicines.map((med) => {
            const stock = med.total_stock || 0;
            const isOutOfStock = stock <= 0;

            return (
              <div
                key={med.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded">
                      {med.dosage_form} ({med.strength})
                    </span>
                    {med.prescription_required && (
                      <span className="text-[9px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.5 rounded">
                        Rx Required
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-sm text-slate-800 mt-2">{med.name}</h3>
                  <div
                    onClick={() => setSelectedGenericId(med.generic_id)}
                    className="text-[11px] text-emerald-700 font-medium hover:underline cursor-pointer flex items-center space-x-1 mt-0.5"
                    title="Click to view all brands formulated with this generic"
                  >
                    <Layers className="w-3 h-3" />
                    <span>{med.generic_name}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {med.manufacturer} &bull; {med.pack_size}
                  </p>
                  {med.description && (
                    <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                      {med.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Unit Price</span>
                    <span className="font-extrabold text-base text-slate-900">
                      {formatCurrency(med.sale_price)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAdd(med)}
                    disabled={isOutOfStock}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5 ${
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
                    ) : isOutOfStock ? (
                      <span>Stock Out</span>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add to Cart</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

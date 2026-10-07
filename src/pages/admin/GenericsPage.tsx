import React, { useState } from 'react';
import { Layers, Plus, Search, Eye, Edit2, Trash2 } from 'lucide-react';
import { db } from '../../services/db';
import { Generic, Medicine } from '../../types';
import { useSettings } from '../../context/SettingsContext';
import { Modal } from '../../components/common/Modal';

export const GenericsPage: React.FC = () => {
  const { formatCurrency } = useSettings();
  const [generics, setGenerics] = useState<Generic[]>(() => db.getGenerics());
  const [search, setSearch] = useState('');
  const [selectedGeneric, setSelectedGeneric] = useState<Generic | null>(null);
  const [showBrandsModal, setShowBrandsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Form
  const [name, setName] = useState('');
  const [indication, setIndication] = useState('');
  const [sideEffects, setSideEffects] = useState('');

  const refresh = () => setGenerics(db.getGenerics());
  const medicines = db.getMedicines();

  const filtered = generics.filter(
    (g) =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.indication?.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenBrands = (gen: Generic) => {
    setSelectedGeneric(gen);
    setShowBrandsModal(true);
  };

  const handleOpenCreate = () => {
    setSelectedGeneric(null);
    setName('');
    setIndication('');
    setSideEffects('');
    setShowEditModal(true);
  };

  const handleOpenEdit = (gen: Generic) => {
    setSelectedGeneric(gen);
    setName(gen.name);
    setIndication(gen.indication || '');
    setSideEffects(gen.side_effects || '');
    setShowEditModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this generic molecule?')) {
      db.deleteGeneric(id);
      refresh();
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    db.saveGeneric({
      id: selectedGeneric?.id,
      name: name.trim(),
      indication: indication.trim(),
      side_effects: sideEffects.trim(),
      status: 'Active',
    });
    refresh();
    setShowEditModal(false);
  };

  const associatedMedicines = selectedGeneric
    ? medicines.filter((m) => m.generic_id === selectedGeneric.id)
    : [];

  return (
    <div className="space-y-5">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Generic Formulations & Molecules</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Active pharmaceutical ingredients (APIs) and available brand alternatives.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Generic</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search generic molecule or therapeutic indication..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((gen) => {
          const brandCount = medicines.filter((m) => m.generic_id === gen.id).length;
          return (
            <div
              key={gen.id}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-800">{gen.name}</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {brandCount} Brand{brandCount === 1 ? '' : 's'} Available
                  </span>
                </div>
                {gen.indication && (
                  <p className="text-xs text-slate-600 mt-2">
                    <strong className="text-slate-400 text-[10px] uppercase block">Indication:</strong>
                    {gen.indication}
                  </p>
                )}
                {gen.side_effects && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    <strong className="text-slate-400 text-[10px] uppercase block">Side Effects:</strong>
                    {gen.side_effects}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleOpenBrands(gen)}
                  className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Available Brands</span>
                </button>

                <div className="flex space-x-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(gen)}
                    className="p-1 text-slate-400 hover:text-emerald-600"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(gen.id)}
                    className="p-1 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Available Brands Modal */}
      <Modal
        isOpen={showBrandsModal}
        onClose={() => setShowBrandsModal(false)}
        title={`Available Brands for: ${selectedGeneric?.name}`}
        maxWidth="lg"
      >
        <div className="space-y-3 text-xs">
          {associatedMedicines.length === 0 ? (
            <p className="p-4 text-center text-slate-400">
              No commercial brands currently formulated for this generic.
            </p>
          ) : (
            associatedMedicines.map((m) => (
              <div
                key={m.id}
                className="p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-200/60"
              >
                <div>
                  <div className="font-bold text-slate-800 text-sm">{m.name}</div>
                  <div className="text-[11px] text-slate-500">
                    {m.manufacturer} &bull; {m.dosage_form} ({m.strength})
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-700 text-sm">
                    {formatCurrency(m.sale_price)}
                  </span>
                  <span className="text-[10px] text-slate-400 block">Stock: {m.total_stock}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* Add / Edit Generic Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={selectedGeneric ? 'Edit Generic' : 'Add Generic'}
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Generic Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Paracetamol, Ciprofloxacin..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Clinical Indication</label>
            <textarea
              rows={2}
              value={indication}
              onChange={(e) => setIndication(e.target.value)}
              placeholder="Primary use..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Common Side Effects</label>
            <textarea
              rows={2}
              value={sideEffects}
              onChange={(e) => setSideEffects(e.target.value)}
              placeholder="Known adverse reactions..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl"
            />
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 bg-slate-100 rounded-xl font-semibold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold"
            >
              Save Generic
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

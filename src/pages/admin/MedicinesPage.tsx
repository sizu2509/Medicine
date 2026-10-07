import React, { useState, useMemo } from 'react';
import {
  Pill,
  Plus,
  Search,
  Filter,
  Download,
  Printer,
  Edit2,
  Trash2,
  Eye,
  AlertTriangle,
  CheckCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { db } from '../../services/db';
import { Medicine, DosageForm } from '../../types';
import { useSettings } from '../../context/SettingsContext';
import { Modal } from '../../components/common/Modal';

export const MedicinesPage: React.FC = () => {
  const { formatCurrency, formatDate } = useSettings();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedForm, setSelectedForm] = useState<string>('all');

  const [medicines, setMedicines] = useState<Medicine[]>(() => db.getMedicines());
  const categories = useMemo(() => db.getCategories(), []);
  const generics = useMemo(() => db.getGenerics(), []);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedMed, setSelectedMed] = useState<Medicine | null>(null);

  // Form Fields
  const [formData, setFormData] = useState<Partial<Medicine>>({
    name: '',
    brand_name: '',
    generic_id: generics[0]?.id || '',
    category_id: categories[0]?.id || '',
    manufacturer: '',
    dosage_form: 'Tablet',
    strength: '',
    unit: 'Strip',
    pack_size: '10 Tablets/Strip',
    barcode: '',
    sku: '',
    prescription_required: false,
    purchase_price: 0,
    sale_price: 0,
    min_stock: 20,
    reorder_level: 50,
    description: '',
    status: 'Active',
  });

  const [formError, setFormError] = useState<string | null>(null);

  const refreshList = () => {
    setMedicines(db.getMedicines());
  };

  const dosageForms: DosageForm[] = [
    'Tablet',
    'Capsule',
    'Syrup',
    'Injection',
    'Cream',
    'Ointment',
    'Drops',
    'Inhaler',
    'Suspension',
    'Powder',
    'Sachet',
    'Suppository',
    'Other',
  ];

  // Filtering
  const filteredMedicines = useMemo(() => {
    return medicines.filter((m) => {
      const matchSearch =
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.generic_name?.toLowerCase().includes(search.toLowerCase()) ||
        m.brand_name.toLowerCase().includes(search.toLowerCase()) ||
        m.barcode?.includes(search) ||
        m.sku?.toLowerCase().includes(search.toLowerCase());

      const matchCat = selectedCategory === 'all' || m.category_id === selectedCategory;
      const matchForm = selectedForm === 'all' || m.dosage_form === selectedForm;

      return matchSearch && matchCat && matchForm;
    });
  }, [medicines, search, selectedCategory, selectedForm]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedMed(null);
    setFormData({
      name: '',
      brand_name: '',
      generic_id: generics[0]?.id || '',
      category_id: categories[0]?.id || '',
      manufacturer: 'Square Pharmaceuticals Ltd.',
      dosage_form: 'Tablet',
      strength: '500mg',
      unit: 'Strip',
      pack_size: '10 Tablets/Strip',
      barcode: `894${Date.now().toString().slice(-9)}`,
      sku: `MED-${Date.now().toString().slice(-4)}`,
      prescription_required: false,
      purchase_price: 25,
      sale_price: 32,
      min_stock: 20,
      reorder_level: 50,
      description: '',
      status: 'Active',
    });
    setFormError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (med: Medicine) => {
    setModalMode('edit');
    setSelectedMed(med);
    setFormData({ ...med });
    setFormError(null);
    setShowModal(true);
  };

  const handleOpenView = (med: Medicine) => {
    setModalMode('view');
    setSelectedMed(med);
    setShowModal(true);
  };

  const handleDelete = (med: Medicine) => {
    if (window.confirm(`Are you sure you want to delete ${med.name}?`)) {
      try {
        db.deleteMedicine(med.id);
        refreshList();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        alert(msg);
      }
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name?.trim()) {
      setFormError('Medicine name is required.');
      return;
    }
    if (!formData.sale_price || formData.sale_price <= 0) {
      setFormError('Sale price must be greater than zero.');
      return;
    }

    try {
      db.saveMedicine({
        id: selectedMed?.id,
        name: formData.name.trim(),
        generic_id: formData.generic_id || generics[0]?.id || '',
        category_id: formData.category_id || categories[0]?.id || '',
        brand_name: formData.brand_name || formData.name,
        manufacturer: formData.manufacturer || 'General Pharma',
        dosage_form: formData.dosage_form as DosageForm,
        strength: formData.strength || '',
        unit: formData.unit || 'Strip',
        pack_size: formData.pack_size || '10/pack',
        barcode: formData.barcode || '',
        sku: formData.sku || `SKU-${Date.now().toString().slice(-6)}`,
        prescription_required: !!formData.prescription_required,
        purchase_price: Number(formData.purchase_price) || 0,
        sale_price: Number(formData.sale_price) || 0,
        min_stock: Number(formData.min_stock) || 10,
        reorder_level: Number(formData.reorder_level) || 30,
        description: formData.description || '',
        status: (formData.status as 'Active' | 'Inactive') || 'Active',
      });

      refreshList();
      setShowModal(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFormError(msg);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Name',
      'Brand',
      'Generic',
      'Category',
      'Dosage Form',
      'Strength',
      'Purchase Price',
      'Sale Price',
      'Total Stock',
      'Status',
    ];
    const rows = filteredMedicines.map((m) => [
      m.id,
      `"${m.name}"`,
      `"${m.brand_name}"`,
      `"${m.generic_name || ''}"`,
      `"${m.category_name || ''}"`,
      m.dosage_form,
      m.strength,
      m.purchase_price,
      m.sale_price,
      m.total_stock || 0,
      m.status,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `medistock-medicines-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="space-y-5">
      {/* Page Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Medicines Master Catalog</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage formulations, pricing, packaging, and regulatory requirements.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Medicine</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, generic, barcode, SKU..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
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
            value={selectedForm}
            onChange={(e) => setSelectedForm(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Dosage Forms</option>
            {dosageForms.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Medicines Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Medicine & Generic</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Dosage / Unit</th>
                <th className="py-3 px-4 text-right">Purchase Price</th>
                <th className="py-3 px-4 text-right">Sale Price</th>
                <th className="py-3 px-4 text-center">Stock</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMedicines.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No medicines found matching the search criteria.
                  </td>
                </tr>
              ) : (
                filteredMedicines.map((med) => {
                  const stock = med.total_stock || 0;
                  const isLow = stock <= med.reorder_level;

                  return (
                    <tr key={med.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-800">{med.name}</span>
                          {med.prescription_required && (
                            <span className="text-[9px] bg-rose-100 text-rose-700 px-1 py-0.2 rounded font-bold">
                              Rx
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {med.generic_name} &bull; {med.manufacturer}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{med.category_name}</td>
                      <td className="py-3 px-4 text-slate-600">
                        {med.dosage_form} ({med.pack_size})
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600">
                        {formatCurrency(med.purchase_price)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-700">
                        {formatCurrency(med.sale_price)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            stock === 0
                              ? 'bg-red-100 text-red-800'
                              : isLow
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {stock} {med.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                            med.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {med.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          type="button"
                          onClick={() => handleOpenView(med)}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(med)}
                          className="p-1 text-slate-400 hover:text-emerald-600 rounded"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(med)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit / View Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={
          modalMode === 'create'
            ? 'Add New Medicine Formulation'
            : modalMode === 'edit'
            ? `Edit Medicine: ${selectedMed?.name}`
            : `Medicine Details: ${selectedMed?.name}`
        }
        maxWidth="3xl"
      >
        {modalMode === 'view' && selectedMed ? (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Brand & Form</span>
                <p className="font-bold text-sm text-slate-800">{selectedMed.name}</p>
                <p className="text-slate-600">{selectedMed.dosage_form} &bull; {selectedMed.strength}</p>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Generic & Category</span>
                <p className="font-semibold text-slate-800">{selectedMed.generic_name}</p>
                <p className="text-slate-600">{selectedMed.category_name}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Purchase Price</span>
                <span className="font-bold text-sm text-slate-700">{formatCurrency(selectedMed.purchase_price)}</span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Sale Price</span>
                <span className="font-bold text-sm text-emerald-700">{formatCurrency(selectedMed.sale_price)}</span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Current Stock</span>
                <span className="font-bold text-sm text-slate-800">{selectedMed.total_stock} {selectedMed.unit}</span>
              </div>
            </div>

            <div className="space-y-1 bg-slate-50 p-3 rounded-xl">
              <div className="flex justify-between">
                <span className="text-slate-500">Barcode:</span>
                <span className="font-mono font-bold">{selectedMed.barcode || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">SKU:</span>
                <span className="font-mono">{selectedMed.sku}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Prescription Required (Rx):</span>
                <span className="font-bold">{selectedMed.prescription_required ? 'Yes (Mandatory)' : 'No (OTC)'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Manufacturer:</span>
                <span>{selectedMed.manufacturer}</span>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-medium">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Medicine Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Napa Extra 500mg+65mg"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Generic Name *</label>
                <select
                  value={formData.generic_id}
                  onChange={(e) => setFormData({ ...formData, generic_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {generics.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category *</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Dosage Form</label>
                <select
                  value={formData.dosage_form}
                  onChange={(e) =>
                    setFormData({ ...formData, dosage_form: e.target.value as DosageForm })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {dosageForms.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Strength</label>
                <input
                  type="text"
                  value={formData.strength || ''}
                  onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                  placeholder="e.g. 500mg, 20mg/5ml"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pack Size & Unit</label>
                <input
                  type="text"
                  value={formData.pack_size || ''}
                  onChange={(e) => setFormData({ ...formData, pack_size: e.target.value })}
                  placeholder="e.g. 10 Tablets/Strip, 100ml Bottle"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Purchase Price (৳) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.purchase_price || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, purchase_price: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sale Price (৳) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.sale_price || ''}
                  onChange={(e) => setFormData({ ...formData, sale_price: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-emerald-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reorder Alert Level</label>
                <input
                  type="number"
                  min="0"
                  value={formData.reorder_level || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, reorder_level: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Manufacturer</label>
                <input
                  type="text"
                  value={formData.manufacturer || ''}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  placeholder="e.g. Square Pharmaceuticals Ltd."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Barcode</label>
                <input
                  type="text"
                  value={formData.barcode || ''}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  placeholder="e.g. 894123456001"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div className="flex items-center space-x-3 pt-6">
                <input
                  type="checkbox"
                  id="rx_required"
                  checked={!!formData.prescription_required}
                  onChange={(e) =>
                    setFormData({ ...formData, prescription_required: e.target.checked })
                  }
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <label htmlFor="rx_required" className="font-bold text-rose-700 cursor-pointer">
                  Requires Doctor's Prescription (Rx)
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs transition-colors"
              >
                Save Formulation
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

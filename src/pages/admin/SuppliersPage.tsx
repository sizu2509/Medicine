import React, { useState } from 'react';
import { Truck, Plus, Search, Phone, Mail, MapPin, Edit2, Trash2 } from 'lucide-react';
import { db } from '../../services/db';
import { Supplier } from '../../types';
import { useSettings } from '../../context/SettingsContext';
import { Modal } from '../../components/common/Modal';

export const SuppliersPage: React.FC = () => {
  const { formatCurrency } = useSettings();
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => db.getSuppliers());
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const [formData, setFormData] = useState<Partial<Supplier>>({
    name: '',
    company: '',
    phone: '',
    email: '',
    address: '',
    contact_person: '',
    opening_balance: 0,
    notes: '',
  });

  const refresh = () => setSuppliers(db.getSuppliers());

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.company.toLowerCase().includes(search.toLowerCase()) ||
      s.phone.includes(search)
  );

  const handleOpenCreate = () => {
    setSelectedSupplier(null);
    setFormData({
      name: '',
      company: '',
      phone: '',
      email: '',
      address: '',
      contact_person: '',
      opening_balance: 0,
      notes: '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (sup: Supplier) => {
    setSelectedSupplier(sup);
    setFormData({ ...sup });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this supplier record?')) {
      db.deleteSupplier(id);
      refresh();
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.company?.trim()) return;

    db.saveSupplier({
      id: selectedSupplier?.id,
      name: formData.name.trim(),
      company: formData.company.trim(),
      phone: formData.phone || '',
      email: formData.email || '',
      address: formData.address || '',
      contact_person: formData.contact_person || '',
      opening_balance: Number(formData.opening_balance) || 0,
      current_balance: selectedSupplier?.current_balance ?? (Number(formData.opening_balance) || 0),
      notes: formData.notes || '',
    });

    refresh();
    setShowModal(false);
  };

  return (
    <div className="space-y-5">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Pharmaceutical Distributors & Suppliers</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage company depots, credit limits, contact persons, and payable balances.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Supplier</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by company, representative, phone..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((sup) => (
          <div
            key={sup.id}
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-800">{sup.name}</h3>
                  <p className="text-xs text-emerald-800 font-semibold">{sup.company}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Outstanding Payable
                  </span>
                  <span
                    className={`font-extrabold text-sm ${
                      sup.current_balance > 0 ? 'text-rose-600' : 'text-slate-700'
                    }`}
                  >
                    {formatCurrency(sup.current_balance)}
                  </span>
                </div>
              </div>

              <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center space-x-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{sup.phone}</span>
                </div>
                {sup.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{sup.email}</span>
                  </div>
                )}
                {sup.address && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{sup.address}</span>
                  </div>
                )}
              </div>

              {sup.contact_person && (
                <div className="mt-3 text-[11px] bg-slate-50 p-2 rounded-lg text-slate-600">
                  <strong className="text-slate-500">Depot Officer:</strong> {sup.contact_person}
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => handleOpenEdit(sup)}
                className="p-1 text-slate-400 hover:text-emerald-600"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(sup.id)}
                className="p-1 text-slate-400 hover:text-rose-600"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={selectedSupplier ? 'Edit Supplier' : 'Add Supplier Depot'}
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Distributor / Supplier Name *</label>
            <input
              type="text"
              required
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Square Pharmaceuticals Ltd."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Corporate Parent / Company *</label>
            <input
              type="text"
              required
              value={formData.company || ''}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              placeholder="e.g. Square Group"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+880 1711..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="depot@pharma.com"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl"
              />
            </div>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Contact Person (Territory Lead)</label>
            <input
              type="text"
              value={formData.contact_person || ''}
              onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
              placeholder="Representative name"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Depot Address</label>
            <input
              type="text"
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Warehouse / Depot location"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl"
            />
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 bg-slate-100 rounded-xl font-semibold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold"
            >
              Save Supplier
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

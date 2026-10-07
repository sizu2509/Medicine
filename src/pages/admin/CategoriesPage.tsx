import React, { useState } from 'react';
import { Tags, Plus, Edit2, Trash2 } from 'lucide-react';
import { db } from '../../services/db';
import { Category } from '../../types';
import { Modal } from '../../components/common/Modal';

export const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>(() => db.getCategories());
  const [showModal, setShowModal] = useState(false);
  const [selectedCat, setSelectedCat] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const refresh = () => setCategories(db.getCategories());

  const handleOpenCreate = () => {
    setSelectedCat(null);
    setName('');
    setDescription('');
    setShowModal(true);
  };

  const handleOpenEdit = (c: Category) => {
    setSelectedCat(c);
    setName(c.name);
    setDescription(c.description || '');
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this category?')) {
      db.deleteCategory(id);
      refresh();
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    db.saveCategory({
      id: selectedCat?.id,
      name: name.trim(),
      slug: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      description: description.trim(),
      is_active: true,
    });
    refresh();
    setShowModal(false);
  };

  return (
    <div className="space-y-5">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Therapeutic Categories</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize medicines into medical departments and classifications.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-800">{cat.name}</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded">
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">{cat.description || 'No description'}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => handleOpenEdit(cat)}
                className="p-1 text-slate-400 hover:text-emerald-600"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(cat.id)}
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
        title={selectedCat ? 'Edit Category' : 'Create Category'}
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Category Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Antibiotics, Cardiology..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Therapeutic purpose..."
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
              Save Category
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

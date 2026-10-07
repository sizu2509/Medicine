import React, { useState, useMemo } from 'react';
import {
  ShoppingCart,
  Plus,
  Search,
  Truck,
  RotateCcw,
  Calendar,
  CheckCircle,
  Trash2,
  Eye,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { db } from '../../services/db';
import { Purchase, PurchaseItem, Supplier, Medicine, PurchaseReturn } from '../../types';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../../components/common/Modal';

export const PurchasesPage: React.FC = () => {
  const { formatCurrency, formatDate } = useSettings();
  const { user } = useAuth();

  const [purchases, setPurchases] = useState<Purchase[]>(() => db.getPurchases());
  const suppliers = useMemo(() => db.getSuppliers(), []);
  const medicines = useMemo(() => db.getMedicines(), []);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);

  // Form State for New Purchase
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentType, setPaymentType] = useState<Purchase['payment_type']>('Bank');
  const [orderDiscount, setOrderDiscount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [purchaseNotes, setPurchaseNotes] = useState('');
  const [items, setItems] = useState<PurchaseItem[]>([]);

  // Item Line State
  const [selectedMedId, setSelectedMedId] = useState(medicines[0]?.id || '');
  const [lineBatchNo, setLineBatchNo] = useState('');
  const [lineMfgDate, setLineMfgDate] = useState(new Date().toISOString().split('T')[0]);
  const [lineExpDate, setLineExpDate] = useState(
    new Date(Date.now() + 365 * 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [lineQty, setLineQty] = useState<number>(100);
  const [lineFreeQty, setLineFreeQty] = useState<number>(0);
  const [linePurchasePrice, setLinePurchasePrice] = useState<number>(20);
  const [lineSalePrice, setLineSalePrice] = useState<number>(28);

  const [formError, setFormError] = useState<string | null>(null);

  // Return State
  const [returnPurchase, setReturnPurchase] = useState<Purchase | null>(null);
  const [returnBatchId, setReturnBatchId] = useState('');
  const [returnQty, setReturnQty] = useState<number>(1);
  const [returnReason, setReturnReason] = useState('Damaged goods received');
  const [returnError, setReturnError] = useState<string | null>(null);

  const refreshList = () => {
    setPurchases(db.getPurchases());
  };

  const addItemToPurchase = () => {
    const med = medicines.find((m) => m.id === selectedMedId);
    if (!med) return;
    if (!lineBatchNo.trim()) {
      setFormError('Batch number is required for every purchased medicine line.');
      return;
    }
    if (new Date(lineExpDate) <= new Date(lineMfgDate)) {
      setFormError('Expiry date must be after manufacturing date.');
      return;
    }

    const newItem: PurchaseItem = {
      medicine_id: med.id,
      medicine_name: med.name,
      batch_number: lineBatchNo.toUpperCase().trim(),
      mfg_date: lineMfgDate,
      expiry_date: lineExpDate,
      quantity: lineQty,
      free_quantity: lineFreeQty,
      purchase_price: linePurchasePrice,
      sale_price: lineSalePrice,
      discount: 0,
      tax: 0,
      total: lineQty * linePurchasePrice,
    };

    setItems((prev) => [...prev, newItem]);
    // Reset item line inputs
    setLineBatchNo('');
    setLineQty(50);
    setFormError(null);
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const subtotal = items.reduce((sum, i) => sum + i.total, 0);
  const total = Math.max(0, subtotal - orderDiscount);
  const due = Math.max(0, total - paidAmount);

  const handleCreatePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      setFormError('Please add at least one medicine item to the invoice.');
      return;
    }
    if (!invoiceNo.trim()) {
      setFormError('Supplier invoice number is required.');
      return;
    }

    try {
      const pNumber = `PO-${Date.now().toString().slice(-6)}`;
      db.createPurchase({
        purchase_number: pNumber,
        invoice_number: invoiceNo.trim(),
        supplier_id: supplierId,
        purchase_date: purchaseDate,
        payment_type: paymentType,
        subtotal,
        discount: orderDiscount,
        vat: 0,
        total,
        paid_amount: paidAmount,
        due_amount: due,
        notes: purchaseNotes,
        items,
        created_by: user?.full_name || 'Pharmacist',
      });

      refreshList();
      setShowCreateModal(false);
      setItems([]);
      setInvoiceNo('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFormError(msg);
    }
  };

  // Open Return
  const handleOpenReturn = (purchase: Purchase) => {
    setReturnPurchase(purchase);
    setReturnError(null);
    setShowReturnModal(true);
  };

  const handleExecuteReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnPurchase) return;

    try {
      const allBatches = db.getBatches();
      // Find matching batch
      const pItem = returnPurchase.items[0]; // default or user chosen
      const targetBatch = allBatches.find(
        (b) => b.medicine_id === pItem.medicine_id && b.batch_number === pItem.batch_number
      );

      if (!targetBatch) {
        throw new Error('Associated batch record not found in inventory.');
      }

      const rNumber = `PRET-${Date.now().toString().slice(-6)}`;
      db.createPurchaseReturn({
        return_number: rNumber,
        purchase_id: returnPurchase.id,
        purchase_number: returnPurchase.purchase_number,
        supplier_id: returnPurchase.supplier_id,
        return_date: new Date().toISOString().split('T')[0],
        total_refund: returnQty * targetBatch.purchase_price,
        notes: returnReason,
        items: [
          {
            batch_id: targetBatch.id,
            medicine_id: targetBatch.medicine_id,
            medicine_name: targetBatch.medicine_name || 'Medicine',
            return_qty: returnQty,
            unit_price: targetBatch.purchase_price,
            total_amount: returnQty * targetBatch.purchase_price,
            reason: returnReason,
          },
        ],
        created_by: user?.full_name || 'Pharmacist',
      });

      refreshList();
      setShowReturnModal(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setReturnError(msg);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Procurement & Purchase Invoices</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log supplier stock shipments, create batch inventory, and track payable dues.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setItems([]);
            setFormError(null);
            setShowCreateModal(true);
          }}
          className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Purchase Entry</span>
        </button>
      </div>

      {/* Purchases List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">PO Number</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Supplier Invoice #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4 text-right">Due</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {purchases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No purchase invoices created yet.
                  </td>
                </tr>
              ) : (
                purchases.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{p.purchase_number}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{p.supplier_name}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{p.invoice_number}</td>
                    <td className="py-3 px-4 text-slate-600">{formatDate(p.purchase_date)}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {p.payment_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {formatCurrency(p.total)}
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-700">
                      {formatCurrency(p.paid_amount)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {p.due_amount > 0 ? (
                        <span className="font-bold text-rose-600">
                          {formatCurrency(p.due_amount)}
                        </span>
                      ) : (
                        <span className="text-slate-400">0.00</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        type="button"
                        onClick={() => setSelectedPurchase(p)}
                        className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                      >
                        View Items
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenReturn(p)}
                        className="px-2 py-1 text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg"
                      >
                        Return
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Purchase Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Purchase Inward Invoice"
        maxWidth="4xl"
      >
        <form onSubmit={handleCreatePurchase} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-medium">
              {formError}
            </div>
          )}

          {/* Supplier & Header Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Supplier *</label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Supplier Inv # *</label>
              <input
                type="text"
                required
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                placeholder="e.g. SQ-INV-9902"
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Purchase Date</label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Type</label>
              <select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value as Purchase['payment_type'])}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
              >
                <option value="Cash">Cash</option>
                <option value="Bank">Bank Transfer</option>
                <option value="bKash">bKash</option>
                <option value="Nagad">Nagad</option>
                <option value="Due">Credit / Due</option>
              </select>
            </div>
          </div>

          {/* Add Item Form Line */}
          <div className="border border-slate-200 p-4 rounded-xl space-y-3 bg-white">
            <h4 className="font-bold text-slate-800 text-xs">Add Received Medicine & Batch</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="col-span-2">
                <label className="block font-medium text-slate-600 mb-1">Medicine *</label>
                <select
                  value={selectedMedId}
                  onChange={(e) => {
                    setSelectedMedId(e.target.value);
                    const m = medicines.find((x) => x.id === e.target.value);
                    if (m) {
                      setLinePurchasePrice(m.purchase_price);
                      setLineSalePrice(m.sale_price);
                    }
                  }}
                  className="w-full px-2 py-1.5 border border-slate-200 rounded-lg"
                >
                  {medicines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.strength})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Batch Number *</label>
                <input
                  type="text"
                  value={lineBatchNo}
                  onChange={(e) => setLineBatchNo(e.target.value)}
                  placeholder="e.g. SQ-26K01"
                  className="w-full px-2 py-1.5 border border-slate-200 rounded-lg font-mono uppercase"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Quantity *</label>
                <input
                  type="number"
                  min="1"
                  value={lineQty}
                  onChange={(e) => setLineQty(Number(e.target.value))}
                  className="w-full px-2 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Mfg Date</label>
                <input
                  type="date"
                  value={lineMfgDate}
                  onChange={(e) => setLineMfgDate(e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Expiry Date *</label>
                <input
                  type="date"
                  value={lineExpDate}
                  onChange={(e) => setLineExpDate(e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-200 rounded-lg font-medium"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Purchase Rate (৳)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={linePurchasePrice}
                  onChange={(e) => setLinePurchasePrice(Number(e.target.value))}
                  className="w-full px-2 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Retail Sale Rate (৳)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={lineSalePrice}
                  onChange={(e) => setLineSalePrice(Number(e.target.value))}
                  className="w-full px-2 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={addItemToPurchase}
              className="px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-bold rounded-lg transition-colors flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Item to Invoice</span>
            </button>
          </div>

          {/* Current Items Table */}
          {items.length > 0 && (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase">
                  <tr>
                    <th className="p-2">Item</th>
                    <th className="p-2">Batch</th>
                    <th className="p-2">Exp</th>
                    <th className="p-2 text-center">Qty</th>
                    <th className="p-2 text-right">Price</th>
                    <th className="p-2 text-right">Total</th>
                    <th className="p-2 text-right">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-2 font-semibold">{it.medicine_name}</td>
                      <td className="p-2 font-mono">{it.batch_number}</td>
                      <td className="p-2">{formatDate(it.expiry_date)}</td>
                      <td className="p-2 text-center font-bold">{it.quantity}</td>
                      <td className="p-2 text-right">{formatCurrency(it.purchase_price)}</td>
                      <td className="p-2 text-right font-bold">{formatCurrency(it.total)}</td>
                      <td className="p-2 text-right">
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="text-rose-500 hover:text-rose-700"
                        >
                          <Trash2 className="w-3.5 h-3.5 ml-auto" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Totals & Settlement */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Invoice Notes</label>
              <textarea
                rows={2}
                value={purchaseNotes}
                onChange={(e) => setPurchaseNotes(e.target.value)}
                placeholder="Optional delivery reference..."
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
              />
            </div>
            <div className="space-y-1 text-right">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-semibold">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-slate-900 pt-1 border-t border-slate-200">
                <span>Total Amount:</span>
                <span className="text-emerald-700">{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span>Paid to Supplier:</span>
                <input
                  type="number"
                  min="0"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(Number(e.target.value))}
                  className="w-24 px-2 py-1 text-right border border-slate-200 rounded bg-white font-bold"
                />
              </div>
              {due > 0 && (
                <div className="flex justify-between text-rose-600 font-bold">
                  <span>Balance Due:</span>
                  <span>{formatCurrency(due)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-3">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold"
            >
              Confirm Purchase & Receive Stock
            </button>
          </div>
        </form>
      </Modal>

      {/* Return Modal */}
      <Modal
        isOpen={showReturnModal}
        onClose={() => setShowReturnModal(false)}
        title="Purchase Return to Supplier"
        subtitle={`PO: ${returnPurchase?.purchase_number}`}
        maxWidth="md"
      >
        {returnPurchase && (
          <form onSubmit={handleExecuteReturn} className="space-y-4 text-xs">
            {returnError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-medium">
                {returnError}
              </div>
            )}

            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Supplier</span>
              <p className="font-bold text-slate-800">{returnPurchase.supplier_name}</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Return Quantity</label>
              <input
                type="number"
                min="1"
                required
                value={returnQty}
                onChange={(e) => setReturnQty(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Reason for Return</label>
              <select
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl"
              >
                <option value="Damaged goods received">Damaged goods received</option>
                <option value="Near expiry from depot">Near expiry batch received</option>
                <option value="Over-shipment difference">Over-shipment difference</option>
                <option value="Wrong product dispatched">Wrong product dispatched</option>
              </select>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowReturnModal(false)}
                className="px-4 py-2 bg-slate-100 rounded-xl font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold"
              >
                Process Return & Deduct Stock
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* View Items Modal */}
      <Modal
        isOpen={!!selectedPurchase}
        onClose={() => setSelectedPurchase(null)}
        title={`Purchase Invoice: ${selectedPurchase?.purchase_number}`}
        maxWidth="2xl"
      >
        {selectedPurchase && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Supplier</span>
                <p className="font-bold text-slate-800">{selectedPurchase.supplier_name}</p>
                <p className="text-slate-500">Invoice: {selectedPurchase.invoice_number}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400">Date & Payment</span>
                <p className="font-semibold text-slate-800">{formatDate(selectedPurchase.purchase_date)}</p>
                <p className="text-slate-500">{selectedPurchase.payment_type}</p>
              </div>
            </div>

            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase">
                <tr>
                  <th className="p-2">Item</th>
                  <th className="p-2">Batch</th>
                  <th className="p-2 text-center">Qty</th>
                  <th className="p-2 text-right">Price</th>
                  <th className="p-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedPurchase.items.map((it, idx) => (
                  <tr key={idx}>
                    <td className="p-2 font-semibold">{it.medicine_name}</td>
                    <td className="p-2 font-mono">{it.batch_number}</td>
                    <td className="p-2 text-center">{it.quantity}</td>
                    <td className="p-2 text-right">{formatCurrency(it.purchase_price)}</td>
                    <td className="p-2 text-right font-bold">{formatCurrency(it.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
};

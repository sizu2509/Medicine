import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Barcode,
  Plus,
  Minus,
  Trash2,
  Printer,
  CreditCard,
  UserPlus,
  Clock,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { db, isExpired } from '../../services/db';
import { Medicine, Batch, Customer, Sale, SaleItem, PaymentMethod } from '../../types';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../../components/common/Modal';
import { ThermalReceipt } from '../../components/common/ThermalReceipt';

interface POSCartItem {
  medicine: Medicine;
  batch: Batch;
  quantity: number;
  unitPrice: number;
  discount: number;
}

export const POSPage: React.FC = () => {
  const { settings, formatCurrency, formatDate } = useSettings();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [prescriptionNo, setPrescriptionNo] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [orderDiscount, setOrderDiscount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [cart, setCart] = useState<POSCartItem[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successSale, setSuccessSale] = useState<Sale | null>(null);

  // Modals
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showBatchSelectModal, setShowBatchSelectModal] = useState(false);
  const [pendingMedicineForBatch, setPendingMedicineForBatch] = useState<Medicine | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const medicines = useMemo(() => db.getMedicines(), []);
  const customers = useMemo(() => db.getCustomers(), []);

  // Filtered medicines for instant POS search
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return medicines
      .filter((m) => {
        return (
          m.name.toLowerCase().includes(q) ||
          m.generic_name?.toLowerCase().includes(q) ||
          m.brand_name.toLowerCase().includes(q) ||
          m.barcode?.toLowerCase().includes(q) ||
          m.sku?.toLowerCase().includes(q)
        );
      })
      .slice(0, 10);
  }, [medicines, searchQuery]);

  // Keyboard shortcut listener (F2, F4, F8)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'F4') {
        e.preventDefault();
        setShowCustomerModal(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Add medicine to cart using FEFO selection
  const handleSelectMedicine = (medicine: Medicine) => {
    setErrorMsg(null);
    // Find all valid non-expired batches for medicine sorted by expiry ASC (FEFO)
    const validBatches = db.getAvailableFEFOBatches(medicine.id);

    if (validBatches.length === 0) {
      // Check if there are batches but they are expired
      const allBatches = db.getBatchesForMedicine(medicine.id);
      const expiredCount = allBatches.filter((b) => isExpired(b.expiry_date)).length;
      if (expiredCount > 0) {
        setErrorMsg(
          `Cannot add "${medicine.name}". All available stock is EXPIRED. Sale of expired stock is strictly prohibited.`
        );
      } else {
        setErrorMsg(`"${medicine.name}" is completely Out of Stock.`);
      }
      return;
    }

    // Select earliest expiry batch (FEFO rule)
    const fefoBatch = validBatches[0];

    // Check if already in cart
    const existing = cart.find(
      (item) => item.medicine.id === medicine.id && item.batch.id === fefoBatch.id
    );

    if (existing) {
      if (existing.quantity + 1 > fefoBatch.remaining_quantity) {
        setErrorMsg(
          `Cannot add more. Batch ${fefoBatch.batch_number} only has ${fefoBatch.remaining_quantity} units available.`
        );
        return;
      }
      setCart((prev) =>
        prev.map((item) =>
          item.medicine.id === medicine.id && item.batch.id === fefoBatch.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart((prev) => [
        ...prev,
        {
          medicine,
          batch: fefoBatch,
          quantity: 1,
          unitPrice: fefoBatch.sale_price || medicine.sale_price,
          discount: 0,
        },
      ]);
    }

    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  const updateQuantity = (index: number, newQty: number) => {
    setErrorMsg(null);
    const item = cart[index];
    if (newQty <= 0) {
      removeFromCart(index);
      return;
    }
    if (newQty > item.batch.remaining_quantity) {
      setErrorMsg(
        `Batch ${item.batch.batch_number} only has ${item.batch.remaining_quantity} available units.`
      );
      return;
    }
    setCart((prev) =>
      prev.map((it, idx) => (idx === index ? { ...it, quantity: newQty } : it))
    );
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const tax = Math.round(subtotal * (settings.tax_rate / 100) * 100) / 100;
  const netTotal = Math.max(0, subtotal - orderDiscount + tax);

  useEffect(() => {
    setPaidAmount(netTotal);
  }, [netTotal]);

  const dueAmount = Math.max(0, netTotal - paidAmount);

  // Complete POS Sale
  const handleCompleteSale = () => {
    setErrorMsg(null);
    if (cart.length === 0) {
      setErrorMsg('Cannot complete sale with an empty cart.');
      return;
    }

    try {
      const invoiceNumber = `${settings.invoice_prefix}${Date.now().toString().slice(-6)}`;
      const saleItems: SaleItem[] = cart.map((item) => ({
        medicine_id: item.medicine.id,
        medicine_name: item.medicine.name,
        batch_id: item.batch.id,
        batch_number: item.batch.batch_number,
        expiry_date: item.batch.expiry_date,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        purchase_price: item.batch.purchase_price,
        discount: item.discount,
        tax: 0,
        total: item.quantity * item.unitPrice - item.discount,
        profit: (item.unitPrice - item.batch.purchase_price) * item.quantity,
      }));

      const newSale = db.createSale({
        invoice_number: invoiceNumber,
        customer_id: selectedCustomerId || undefined,
        customer_name: customerName,
        customer_phone: customerPhone || undefined,
        prescription_id: prescriptionNo || undefined,
        sale_date: new Date().toISOString().split('T')[0],
        payment_method: paymentMethod,
        subtotal,
        discount: orderDiscount,
        tax,
        total: netTotal,
        paid_amount: paidAmount,
        due_amount: dueAmount,
        cashier_name: user?.full_name || 'Pharmacist',
        items: saleItems,
      });

      // Clear cart and show receipt
      setCart([]);
      setSuccessSale(newSale);
      setShowReceiptModal(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Bar: Title & Quick Shortcuts Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white px-4 py-3 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800">Pharmacy POS Checkout</h1>
            <p className="text-[11px] text-slate-500">
              FEFO batch auto-routing &bull; Real-time margin audit &bull; DGDA Compliant
            </p>
          </div>
        </div>

        {/* Shortcuts pills */}
        <div className="hidden sm:flex items-center space-x-2 text-[11px] text-slate-500">
          <span className="flex items-center space-x-1 bg-slate-100 px-2 py-1 rounded">
            <kbd className="font-mono font-bold text-slate-800">F2</kbd>
            <span>Search</span>
          </span>
          <span className="flex items-center space-x-1 bg-slate-100 px-2 py-1 rounded">
            <kbd className="font-mono font-bold text-slate-800">F4</kbd>
            <span>Customer</span>
          </span>
          <span className="flex items-center space-x-1 bg-slate-100 px-2 py-1 rounded">
            <kbd className="font-mono font-bold text-emerald-700">Enter</kbd>
            <span>Select Item</span>
          </span>
        </div>
      </div>

      {/* Error / Alert Banner */}
      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-rose-500 hover:text-rose-700 font-bold"
          >
            &times;
          </button>
        </div>
      )}

      {/* Main Grid: Left Search & Medicine List, Right Cart / Billing */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Side: Search & Medicine Selection (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Search Box */}
          <div className="relative bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search medicine by Brand, Generic, Barcode (e.g. Napa, Seclo, 894123456001)..."
                className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
              <Barcode className="w-4 h-4 text-slate-400 absolute right-3" />
            </div>

            {/* Instant Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="mt-2 divide-y divide-slate-100 border-t border-slate-100 max-h-72 overflow-y-auto">
                {searchResults.map((med) => {
                  const stock = med.total_stock || 0;
                  const isLow = stock <= med.reorder_level;
                  const isOut = stock <= 0;

                  return (
                    <div
                      key={med.id}
                      onClick={() => handleSelectMedicine(med)}
                      className={`p-2.5 flex items-center justify-between hover:bg-emerald-50/60 cursor-pointer rounded-xl transition-colors ${
                        isOut ? 'opacity-50' : ''
                      }`}
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xs text-slate-800">{med.name}</span>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                            {med.dosage_form}
                          </span>
                          {med.prescription_required && (
                            <span className="text-[9px] bg-amber-100 text-amber-800 px-1 py-0.2 rounded font-bold">
                              Rx Required
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {med.generic_name} &bull; {med.manufacturer}
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-xs text-emerald-700">
                          {formatCurrency(med.sale_price)}
                        </div>
                        <span
                          className={`text-[10px] font-semibold ${
                            isOut
                              ? 'text-rose-600'
                              : isLow
                              ? 'text-amber-600'
                              : 'text-slate-500'
                          }`}
                        >
                          Stock: {stock}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Category Buttons / Frequent items */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Fast Dispense (Frequently Sold)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {medicines.slice(0, 6).map((med) => {
                const stock = med.total_stock || 0;
                return (
                  <div
                    key={med.id}
                    onClick={() => handleSelectMedicine(med)}
                    className="p-3 bg-slate-50 hover:bg-emerald-50/80 border border-slate-200/70 hover:border-emerald-200 rounded-xl cursor-pointer transition-all"
                  >
                    <div className="font-bold text-xs text-slate-800 truncate">{med.name}</div>
                    <div className="text-[10px] text-slate-500 truncate">{med.generic_name}</div>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="font-extrabold text-emerald-700">
                        {formatCurrency(med.sale_price)}
                      </span>
                      <span className="text-[10px] text-slate-400">Stock: {stock}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Active Cart & Invoice Settlement (5 cols) */}
        <div className="lg:col-span-5 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            {/* Customer selector bar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div
                onClick={() => setShowCustomerModal(true)}
                className="cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg flex items-center space-x-2"
              >
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                  {customerName.charAt(0)}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">{customerName}</div>
                  <div className="text-[10px] text-slate-400">
                    {customerPhone || 'Walk-in / Cash Sale'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowCustomerModal(true)}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800"
              >
                Change (F4)
              </button>
            </div>

            {/* Cart Table */}
            <div className="mt-3">
              <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-100">
                <span>Medicine & Batch (FEFO)</span>
                <span>Qty x Rate</span>
                <span>Total</span>
              </div>

              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 mt-1">
                {cart.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    Cart is empty. Search medicine or use barcode scanner.
                  </div>
                ) : (
                  cart.map((item, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="pr-2 max-w-[150px] sm:max-w-[180px]">
                        <div className="font-semibold text-slate-800 truncate">
                          {item.medicine.name}
                        </div>
                        <div className="text-[10px] text-emerald-700 flex items-center space-x-1 font-mono">
                          <span>Batch: {item.batch.batch_number}</span>
                          <span>&bull;</span>
                          <span>Exp: {formatDate(item.batch.expiry_date)}</span>
                        </div>
                      </div>

                      {/* Quantity controls */}
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => updateQuantity(idx, item.quantity - 1)}
                          className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center font-bold text-xs">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(idx, item.quantity + 1)}
                          className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Total & remove */}
                      <div className="flex items-center space-x-2 text-right">
                        <span className="font-bold text-slate-800">
                          {formatCurrency(item.quantity * item.unitPrice)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFromCart(idx)}
                          className="text-slate-400 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Settlement Bottom Panel */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            {/* Summary Lines */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600 items-center">
                <span>Special Discount:</span>
                <div className="flex items-center space-x-1">
                  <span>-</span>
                  <input
                    type="number"
                    min="0"
                    value={orderDiscount || ''}
                    onChange={(e) => setOrderDiscount(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="w-16 px-1.5 py-0.5 text-right text-xs border border-slate-200 rounded"
                  />
                </div>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Govt VAT ({settings.tax_rate}%):</span>
                <span>+{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-slate-900 pt-1 border-t border-slate-100">
                <span>Net Total:</span>
                <span className="text-emerald-700">{formatCurrency(netTotal)}</span>
              </div>
            </div>

            {/* Payment Method Selector (Cash, bKash, Nagad, Rocket, Card, Due) */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Payment Channel
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {(['Cash', 'bKash', 'Nagad', 'Rocket', 'Card', 'Due'] as PaymentMethod[]).map(
                  (method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                        paymentMethod === method
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {method}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Paid Amount & Due Calculation */}
            <div className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-xl">
              <div className="flex items-center space-x-2">
                <span className="text-slate-500">Received:</span>
                <input
                  type="number"
                  min="0"
                  value={paidAmount || ''}
                  onChange={(e) => setPaidAmount(Number(e.target.value) || 0)}
                  className="w-24 px-2 py-1 text-xs font-bold bg-white border border-slate-200 rounded-lg text-slate-900"
                />
              </div>
              {dueAmount > 0 && (
                <div className="text-rose-600 font-bold">Due: {formatCurrency(dueAmount)}</div>
              )}
            </div>

            {/* Confirm & Checkout Button */}
            <button
              type="button"
              onClick={handleCompleteSale}
              disabled={cart.length === 0}
              className={`w-full py-3 rounded-xl font-bold text-xs text-white flex items-center justify-center space-x-2 transition-all shadow-md ${
                cart.length === 0
                  ? 'bg-slate-300 cursor-not-allowed shadow-none'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30 active:scale-[0.99]'
              }`}
            >
              <span>Complete Sale & Print Receipt</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Customer Selection Modal */}
      <Modal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        title="Select Customer or Patient"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer"
            onClick={() => {
              setSelectedCustomerId('');
              setCustomerName('Walk-in Customer');
              setCustomerPhone('');
              setShowCustomerModal(false);
            }}
          >
            <div className="font-bold text-xs text-slate-800">Walk-in Customer</div>
            <div className="text-[11px] text-slate-500">Immediate cash counter transaction</div>
          </div>

          <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
            {customers.map((c) => (
              <div
                key={c.id}
                onClick={() => {
                  setSelectedCustomerId(c.id);
                  setCustomerName(c.name);
                  setCustomerPhone(c.phone);
                  setShowCustomerModal(false);
                }}
                className="py-2.5 px-3 hover:bg-emerald-50 rounded-lg cursor-pointer flex justify-between items-center text-xs"
              >
                <div>
                  <div className="font-bold text-slate-800">{c.name}</div>
                  <div className="text-[11px] text-slate-500">{c.phone}</div>
                </div>
                {c.due_amount > 0 && (
                  <span className="text-[10px] text-rose-600 font-bold">
                    Due: {formatCurrency(c.due_amount)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Receipt Modal on Sale Completion */}
      <Modal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        title="Sale Completed Successfully"
        maxWidth="2xl"
      >
        {successSale && (
          <ThermalReceipt sale={successSale} onClose={() => setShowReceiptModal(false)} />
        )}
      </Modal>
    </div>
  );
};

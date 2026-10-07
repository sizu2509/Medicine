import React, { useState } from 'react';
import { ShieldCheck, Upload, FileCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useSettings } from '../../context/SettingsContext';
import { db } from '../../services/db';
import { PaymentMethod } from '../../types';

interface CheckoutPageProps {
  navigate: (route: string) => void;
  setLastOrderNumber: (orderNo: string) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ navigate, setLastOrderNumber }) => {
  const { cart, subtotal, hasPrescriptionRequiredItems, clearCart } = useCart();
  const { formatCurrency } = useSettings();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [prescriptionUploaded, setPrescriptionUploaded] = useState(false);
  const [prescriptionFileName, setPrescriptionFileName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const deliveryFee = 50;
  const total = subtotal + deliveryFee;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPrescriptionFileName(e.target.files[0].name);
      setPrescriptionUploaded(true);
      setErrorMsg(null);
    }
  };

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (cart.length === 0) {
      navigate('/cart');
      return;
    }

    if (!customerName.trim() || !customerPhone.trim() || !deliveryAddress.trim()) {
      setErrorMsg('Please complete all required delivery details.');
      return;
    }

    // Prescription rule enforcement
    if (hasPrescriptionRequiredItems && !prescriptionUploaded) {
      setErrorMsg(
        'A doctor prescription upload is strictly required for prescription-only medicines in your cart.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
      const orderItems = cart.map((i) => ({
        medicine_id: i.medicine.id,
        medicine_name: i.medicine.name,
        price: i.medicine.sale_price,
        quantity: i.quantity,
        total: i.medicine.sale_price * i.quantity,
        prescription_required: i.medicine.prescription_required,
      }));

      db.createOrder({
        order_number: orderNumber,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim() || undefined,
        delivery_address: deliveryAddress.trim(),
        items: orderItems,
        subtotal,
        discount: 0,
        delivery_fee: deliveryFee,
        total,
        payment_method: paymentMethod,
        prescription_url: prescriptionUploaded ? `https://storage.medistockpro.com/rx/${prescriptionFileName}` : undefined,
        status: 'Pending',
      });

      setLastOrderNumber(orderNumber);
      clearCart();
      navigate('/order-success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Secure Pharmacy Checkout</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Provide delivery coordinates and upload medical documents for verification.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="font-semibold">{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left: Patient & Delivery Info (7 cols) */}
        <div className="md:col-span-7 space-y-5">
          {/* Patient Details Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 text-sm">Delivery Information</h3>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Patient / Customer Name *
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Full Name"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mobile Number (Bangladesh) *
                </label>
                <input
                  type="text"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="01712-345678"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="optional@gmail.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Full Street Delivery Address *
              </label>
              <textarea
                rows={2}
                required
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Apartment/Flat, House, Road, Sector/Area, City (e.g. Uttara, Dhaka)"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          {/* Prescription Upload Card */}
          <div
            className={`p-5 rounded-2xl border shadow-xs space-y-3 text-xs ${
              hasPrescriptionRequiredItems
                ? 'bg-amber-50/50 border-amber-300'
                : 'bg-white border-slate-200/80'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Doctor's Prescription Upload
                </h3>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  {hasPrescriptionRequiredItems
                    ? 'Mandatory: Your cart includes prescription-only medication.'
                    : 'Optional: Upload if you want a pharmacist to review dosage instructions.'}
                </p>
              </div>
              {hasPrescriptionRequiredItems && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                  Required
                </span>
              )}
            </div>

            <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:bg-slate-50/50 transition-colors">
              <input
                type="file"
                id="rx-file"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label htmlFor="rx-file" className="cursor-pointer space-y-2 block">
                {prescriptionUploaded ? (
                  <div className="flex items-center justify-center space-x-2 text-emerald-700 font-bold">
                    <FileCheck className="w-5 h-5" />
                    <span>Prescription Uploaded: {prescriptionFileName}</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                    <span className="text-emerald-700 font-bold block">
                      Click to choose prescription photo or PDF
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      JPEG, PNG, or PDF up to 10MB
                    </span>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 text-sm">Payment Method</h3>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  { id: 'Cash', label: 'Cash on Delivery (COD)' },
                  { id: 'bKash', label: 'bKash Mobile Banking' },
                  { id: 'Nagad', label: 'Nagad Digital Payment' },
                  { id: 'Card', label: 'VISA / Mastercard' },
                ] as const
              ).map((m) => (
                <label
                  key={m.id}
                  className={`p-3 rounded-xl border flex items-center space-x-2 cursor-pointer transition-all ${
                    paymentMethod === m.id
                      ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900 font-bold'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={m.id}
                    checked={paymentMethod === m.id}
                    onChange={() => setPaymentMethod(m.id)}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>{m.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Order Summary Sidebar (5 cols) */}
        <div className="md:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 self-start text-xs">
          <h3 className="font-bold text-slate-900 text-sm">Order Overview</h3>

          <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
            {cart.map((item) => (
              <div key={item.medicine.id} className="py-2.5 flex justify-between">
                <div>
                  <div className="font-semibold text-slate-800">{item.medicine.name}</div>
                  <div className="text-[10px] text-slate-400">
                    {item.quantity} x {formatCurrency(item.medicine.sale_price)}
                  </div>
                </div>
                <span className="font-bold text-slate-900">
                  {formatCurrency(item.medicine.sale_price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-900">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Delivery Charge:</span>
              <span className="font-semibold text-slate-900">{formatCurrency(deliveryFee)}</span>
            </div>
            <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-100">
              <span>Grand Total:</span>
              <span className="text-emerald-700">{formatCurrency(total)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-colors shadow-md shadow-emerald-600/25 flex items-center justify-center space-x-2"
          >
            <span>{isSubmitting ? 'Confirming Order...' : 'Confirm & Place Order'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

import React from 'react';
import { ShoppingCart, Plus, Minus, Trash2, ArrowRight, ShieldAlert, ArrowLeft } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useSettings } from '../../context/SettingsContext';

interface CartPageProps {
  navigate: (route: string) => void;
}

export const CartPage: React.FC<CartPageProps> = ({ navigate }) => {
  const { cart, updateQuantity, removeFromCart, subtotal, hasPrescriptionRequiredItems, clearCart } =
    useCart();
  const { formatCurrency } = useSettings();

  const deliveryFee = 50; // standard delivery fee in Dhaka BDT
  const total = subtotal + deliveryFee;

  if (cart.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <ShoppingCart className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Your Medicine Cart is Empty</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Browse our extensive catalog of genuine pharmaceutical formulations and add them to your cart.
        </p>
        <button
          type="button"
          onClick={() => navigate('/medicines')}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-colors shadow-xs"
        >
          Explore Medicines Catalog
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Your Medicine Shopping Bag</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review your healthcare products before proceeding to secure checkout.
          </p>
        </div>
        <button
          type="button"
          onClick={clearCart}
          className="text-xs text-rose-600 hover:underline font-semibold"
        >
          Clear Cart
        </button>
      </div>

      {/* Prescription Warning Banner */}
      {hasPrescriptionRequiredItems && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start space-x-3 text-xs">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">Prescription Required (Rx Notice)</h4>
            <p className="mt-1 text-slate-600">
              Your bag contains regulated prescription medicines. Under DGDA guidelines, you will be required to upload a clear doctor's prescription photo during the next step.
            </p>
          </div>
        </div>
      )}

      {/* Cart Items List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
          {cart.map((item) => (
            <div key={item.medicine.id} className="p-4 flex items-center justify-between text-xs">
              <div className="space-y-1 max-w-[200px] sm:max-w-xs">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-800 text-sm">{item.medicine.name}</span>
                  {item.medicine.prescription_required && (
                    <span className="text-[9px] bg-rose-100 text-rose-700 font-bold px-1.5 py-0.2 rounded">
                      Rx
                    </span>
                  )}
                </div>
                <p className="text-slate-500">{item.medicine.generic_name}</p>
                <p className="text-[10px] text-slate-400">
                  {item.medicine.dosage_form} &bull; {item.medicine.manufacturer}
                </p>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => updateQuantity(item.medicine.id, item.quantity - 1)}
                  className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-slate-600 hover:text-slate-900"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-8 text-center font-bold text-slate-900 text-xs">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => updateQuantity(item.medicine.id, item.quantity + 1)}
                  className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-slate-600 hover:text-slate-900"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Total & Trash */}
              <div className="flex items-center space-x-3 text-right">
                <div>
                  <span className="font-extrabold text-sm text-slate-900">
                    {formatCurrency(item.medicine.sale_price * item.quantity)}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {formatCurrency(item.medicine.sale_price)} each
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFromCart(item.medicine.id)}
                  className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary Checkout Card */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 self-start">
          <h3 className="font-bold text-slate-900 text-sm">Order Summary</h3>

          <div className="space-y-2 text-xs divide-y divide-slate-100">
            <div className="flex justify-between text-slate-600 pt-1">
              <span>Medicines Subtotal:</span>
              <span className="font-semibold text-slate-900">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600 pt-2">
              <span>Courier Delivery Fee:</span>
              <span className="font-semibold text-slate-900">{formatCurrency(deliveryFee)}</span>
            </div>
            <div className="flex justify-between text-base font-extrabold text-slate-900 pt-3">
              <span>Estimated Total:</span>
              <span className="text-emerald-700">{formatCurrency(total)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/checkout')}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-colors flex items-center justify-center space-x-2 shadow-xs"
          >
            <span>Proceed to Delivery & Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => navigate('/medicines')}
            className="w-full text-center text-xs text-slate-500 hover:text-slate-800 font-medium"
          >
            &larr; Continue Adding Medicines
          </button>
        </div>
      </div>
    </div>
  );
};

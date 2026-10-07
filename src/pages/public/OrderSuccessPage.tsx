import React from 'react';
import { CheckCircle2, Package, Phone, ArrowRight, ShieldCheck } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

interface OrderSuccessPageProps {
  orderNumber: string;
  navigate: (route: string) => void;
}

export const OrderSuccessPage: React.FC<OrderSuccessPageProps> = ({ orderNumber, navigate }) => {
  const { settings } = useSettings();

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
      <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center animate-bounce">
        <CheckCircle2 className="w-10 h-10" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Order Placed Successfully!
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Thank you for choosing {settings.pharmacy_name}. Our registered pharmacist is reviewing your medicines.
        </p>
      </div>

      {/* Order Info Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs max-w-md mx-auto space-y-3 text-xs text-left">
        <div className="flex justify-between border-b border-slate-100 pb-2">
          <span className="text-slate-500">Order Reference #:</span>
          <span className="font-mono font-bold text-slate-900">{orderNumber || 'ORD-2026-001'}</span>
        </div>
        <div className="flex justify-between border-b border-slate-100 pb-2">
          <span className="text-slate-500">Status:</span>
          <span className="font-bold text-emerald-700">Confirmed (Processing)</span>
        </div>
        <div className="flex justify-between border-b border-slate-100 pb-2">
          <span className="text-slate-500">Estimated Delivery:</span>
          <span className="font-semibold text-slate-800">Within 2 to 4 hours</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Support Hotline:</span>
          <span className="font-semibold text-slate-800">{settings.phone}</span>
        </div>
      </div>

      <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/medicines')}
          className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-colors shadow-xs"
        >
          Continue Shopping
        </button>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="w-full sm:w-auto px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs transition-colors"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

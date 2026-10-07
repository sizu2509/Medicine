import React, { useState } from 'react';
import { FileSpreadsheet, Eye, CheckCircle2, Clock, Truck, XCircle, ShoppingBag } from 'lucide-react';
import { db } from '../../services/db';
import { Prescription, OnlineOrder } from '../../types';
import { useSettings } from '../../context/SettingsContext';
import { Modal } from '../../components/common/Modal';

export const PrescriptionsPage: React.FC = () => {
  const { formatCurrency, formatDate } = useSettings();
  const [activeTab, setActiveTab] = useState<'orders' | 'rx'>('orders');

  const [orders, setOrders] = useState<OnlineOrder[]>(() => db.getOrders());
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(() => db.getPrescriptions());
  const [selectedOrder, setSelectedOrder] = useState<OnlineOrder | null>(null);

  const refresh = () => {
    setOrders(db.getOrders());
    setPrescriptions(db.getPrescriptions());
  };

  const handleUpdateStatus = (orderId: string, status: OnlineOrder['status']) => {
    db.updateOrderStatus(orderId, status);
    refresh();
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-800">
            {activeTab === 'orders' ? 'Online Customer Orders' : 'Prescription Records (Rx)'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Process home delivery orders placed via the public website and verify prescriptions.
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'orders' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Online Orders ({orders.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rx')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'rx' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Prescriptions ({prescriptions.length})
          </button>
        </div>
      </div>

      {activeTab === 'orders' ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Address</th>
                  <th className="py-3 px-4 text-center">Items</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No online customer orders received yet.
                    </td>
                  </tr>
                ) : (
                  orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {ord.order_number}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{ord.customer_name}</td>
                      <td className="py-3 px-4 text-slate-600">{ord.customer_phone}</td>
                      <td className="py-3 px-4 text-slate-600 max-w-[180px] truncate">
                        {ord.delivery_address}
                      </td>
                      <td className="py-3 px-4 text-center font-bold">{ord.items.length} items</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-700">
                        {formatCurrency(ord.total)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            ord.status === 'Confirmed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ord.status === 'Pending'
                              ? 'bg-amber-100 text-amber-800'
                              : ord.status === 'Out for Delivery'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {ord.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(ord)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                        >
                          View Order
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {prescriptions.map((rx) => (
            <div
              key={rx.id}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-sm text-slate-800">{rx.customer_name}</h3>
                  <p className="text-xs text-slate-500">Doctor: {rx.doctor_name}</p>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800">
                  {rx.status}
                </span>
              </div>

              {rx.medicines && rx.medicines.length > 0 && (
                <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    Prescribed Dosage:
                  </span>
                  {rx.medicines.map((m, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="font-medium text-slate-800">{m.medicine_name}</span>
                      <span className="text-slate-500">
                        {m.dosage} ({m.duration})
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Order Details Modal */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Order Details: ${selectedOrder?.order_number}`}
        maxWidth="lg"
      >
        {selectedOrder && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-bold text-slate-800">{selectedOrder.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phone:</span>
                <span>{selectedOrder.customer_phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Delivery Address:</span>
                <span className="text-right max-w-[200px]">{selectedOrder.delivery_address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Channel:</span>
                <span className="font-bold uppercase text-emerald-700">
                  {selectedOrder.payment_method}
                </span>
              </div>
            </div>

            <div className="border border-slate-100 rounded-xl overflow-hidden">
              <div className="p-2 bg-slate-100 font-bold text-slate-700 text-[11px]">Ordered Items</div>
              <div className="divide-y divide-slate-100">
                {selectedOrder.items.map((it, idx) => (
                  <div key={idx} className="p-2.5 flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-slate-800">{it.medicine_name}</div>
                      <div className="text-[10px] text-slate-500">
                        {it.quantity} x {formatCurrency(it.price)}
                      </div>
                    </div>
                    <span className="font-bold text-slate-900">{formatCurrency(it.total)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between font-bold text-sm text-slate-900 bg-slate-50 p-3 rounded-xl">
              <span>Order Total (incl. delivery):</span>
              <span className="text-emerald-700">{formatCurrency(selectedOrder.total)}</span>
            </div>

            {/* Status change actions */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2 justify-end">
              {(
                ['Confirmed', 'Processing', 'Out for Delivery', 'Delivered', 'Cancelled'] as const
              ).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => {
                    handleUpdateStatus(selectedOrder.id, status);
                    setSelectedOrder(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    selectedOrder.status === status
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Mark {status}
                </button>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

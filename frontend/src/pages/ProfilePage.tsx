import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useLang } from '../hooks/useLang';
import { formatPrice } from '../types';
import client from '../api/client';
import { Lock, Package, Clock, ChevronRight, ShoppingBag, Mail } from 'lucide-react';

interface OrderData {
  id: number;
  orderNumber: string;
  status: string;
  subtotalTiyin: number;
  totalTiyin: number;
  shippingMethod?: string;
  items: { id: number; productTitle: string; variantSku: string; quantity: number; unitPriceTiyin: number; totalPriceTiyin: number }[];
  createdAt: string;
}

function statusColor(status: string): string {
  const map: Record<string, string> = {
    payment_pending: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
    payment_failed: 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400',
    confirmed: 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400',
    processing: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400',
    shipped: 'bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400',
    delivered: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
    cancelled: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    refunded: 'bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400',
  };
  return map[status] || 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    payment_pending: 'Payment Pending',
    payment_failed: 'Payment Failed',
    confirmed: 'Confirmed',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
  };
  return map[status] || status;
}

export function ProfilePage() {
  const { t } = useLang();
  const { user, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return; }
    client.get('/stores/1/orders')
      .then(res => {
        const d = res.data;
        const items = d?.data || d || [];
        setOrders(Array.isArray(items) ? items : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <Lock size={40} className="mx-auto mb-4 text-slate-300 dark:text-slate-700" />
        <p className="text-lg font-medium text-slate-500 dark:text-slate-400 mb-4">{t('profile_login_required')}</p>
        <p className="text-slate-400 text-sm">{t('auth_demo')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-24 md:pb-8">
      {/* Profile Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-xl font-bold">
            {user?.firstName?.charAt(0) || 'U'}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {user?.firstName} {user?.lastName}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1"><Mail size={12} /> {user?.email}</span>
              <span className="flex items-center gap-1"><Package size={12} /> {orders.length} {t('profile_orders_count')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Order Detail */}
      {selectedOrder && (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 mb-6 animate-fade-in-fast">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Package size={18} className="text-slate-400" />
              {t('order_details')} — {selectedOrder.orderNumber}
            </h2>
            <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-600 text-sm font-medium">
              ← {t('back_to_orders')}
            </button>
          </div>

          <div className="flex flex-wrap gap-3 mb-4">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${statusColor(selectedOrder.status)}`}>
              {statusLabel(selectedOrder.status)}
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock size={11} /> {new Date(selectedOrder.createdAt).toLocaleDateString('kk-KZ')}
            </span>
          </div>

          <div className="space-y-3">
            {selectedOrder.items.map(item => (
              <div key={item.id} className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white text-sm">{item.productTitle}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{item.variantSku} × {item.quantity}</p>
                </div>
                <p className="font-bold text-slate-900 dark:text-white text-sm">{formatPrice(item.totalPriceTiyin)}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <span className="text-base font-bold text-slate-900 dark:text-white">{t('order_total')}</span>
            <span className="text-xl font-bold text-slate-900 dark:text-white">{formatPrice(selectedOrder.totalTiyin)}</span>
          </div>
        </div>
      )}

      {/* Orders List */}
      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
        <ShoppingBag size={18} className="text-slate-400" />
        {t('profile_my_orders')}
      </h2>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="skeleton h-20 rounded-xl" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <Package size={40} className="mx-auto mb-4 text-slate-300 dark:text-slate-700" />
          <p className="text-base font-medium text-slate-500 dark:text-slate-400 mb-2">{t('profile_no_orders')}</p>
          <Link to="/products" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium text-sm">{t('order_shop_more')}</Link>
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map(order => (
            <button
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className="w-full text-left bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 card-hover group transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                    <Package size={16} className="text-slate-400" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white text-sm font-mono">{order.orderNumber}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${statusColor(order.status)}`}>
                        {statusLabel(order.status)}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock size={10} /> {new Date(order.createdAt).toLocaleDateString('kk-KZ')}
                      </span>
                      <span className="text-xs text-slate-400">{order.items?.length || 0} items</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-slate-900 dark:text-white">{formatPrice(order.totalTiyin)}</span>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

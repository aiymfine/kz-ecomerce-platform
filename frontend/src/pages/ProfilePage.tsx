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
    payment_pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    payment_failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    processing: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    shipped: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    delivered: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    cancelled: 'bg-gray-100 text-gray-500 dark:bg-gray-900/30 dark:text-gray-500',
    refunded: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  };
  return map[status] || 'bg-gray-100 text-gray-500';
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    payment_pending: '⏳ Ожидание оплаты',
    payment_failed: '❌ Оплата не удалась',
    confirmed: '✅ Подтверждён',
    processing: '🔄 В обработке',
    shipped: '🚚 Отправлен',
    delivered: '✅ Доставлен',
    cancelled: '🚫 Отменён',
    refunded: '💰 Возврат',
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
      .catch(() => {
        // orders might require merchant role — try customer-specific endpoint
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center animate-fade-in">
        <Lock size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
        <p className="text-xl font-semibold text-gray-500 dark:text-gray-400 mb-4">{t('profile_login_required')}</p>
        <p className="text-gray-400 text-sm">{t('auth_demo')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-24 md:pb-8 animate-fade-in-up">
      {/* Profile Header */}
      <div className="bg-white dark:bg-[#14141F]/80 rounded-2xl p-6 border border-gray-100 dark:border-white/5 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-kz-blue to-kz-gold rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            {user?.firstName?.charAt(0) || 'U'}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
              {user?.firstName} {user?.lastName}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1"><Mail size={13} /> {user?.email}</span>
              <span className="flex items-center gap-1"><Package size={13} /> {orders.length} {t('profile_orders_count')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Order Detail */}
      {selectedOrder && (
        <div className="bg-white dark:bg-[#14141F]/80 rounded-2xl p-6 border border-gray-100 dark:border-white/5 mb-8 animate-scale-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Package size={20} className="text-kz-blue" />
              {t('order_details')} — {selectedOrder.orderNumber}
            </h2>
            <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600 text-sm font-medium">
              ← {t('back_to_orders')}
            </button>
          </div>

          <div className="flex flex-wrap gap-3 mb-4">
            <span className={`text-xs font-bold px-3 py-1.5 rounded-lg ${statusColor(selectedOrder.status)}`}>
              {statusLabel(selectedOrder.status)}
            </span>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Clock size={12} /> {new Date(selectedOrder.createdAt).toLocaleDateString('kk-KZ')}
            </span>
          </div>

          <div className="space-y-3">
            {selectedOrder.items.map(item => (
              <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-white/5 last:border-0">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{item.productTitle}</p>
                  <p className="text-xs text-gray-400">{item.variantSku} × {item.quantity}</p>
                </div>
                <p className="font-bold text-gray-900 dark:text-white">{formatPrice(item.totalPriceTiyin)}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center mt-4 pt-4 border-t-2 border-gray-100 dark:border-white/5">
            <span className="text-lg font-bold text-gray-900 dark:text-white">{t('order_total')}</span>
            <span className="text-2xl font-extrabold text-kz-blue">{formatPrice(selectedOrder.totalTiyin)}</span>
          </div>
        </div>
      )}

      {/* Orders List */}
      <h2 className="text-xl font-extrabold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <ShoppingBag size={22} className="text-kz-blue" />
        {t('profile_my_orders')}
      </h2>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="skeleton h-20 rounded-xl" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <Package size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <p className="text-lg font-semibold text-gray-500 dark:text-gray-400 mb-2">{t('profile_no_orders')}</p>
          <Link to="/products" className="text-kz-blue hover:underline font-medium">{t('order_shop_more')}</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <button
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className="w-full text-left bg-white dark:bg-[#14141F]/80 rounded-2xl p-5 border border-gray-100 dark:border-white/5 card-hover group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-kz-blue/10 to-kz-gold/5 rounded-xl flex items-center justify-center">
                    <Package size={20} className="text-kz-blue" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white text-sm font-mono">{order.orderNumber}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${statusColor(order.status)}`}>
                        {statusLabel(order.status)}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock size={10} /> {new Date(order.createdAt).toLocaleDateString('kk-KZ')}
                      </span>
                      <span className="text-xs text-gray-400">{order.items?.length || 0} {t('cart_items_count')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-extrabold text-kz-blue">{formatPrice(order.totalTiyin)}</span>
                  <ChevronRight size={16} className="text-gray-300 group-hover:text-kz-blue transition-colors" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

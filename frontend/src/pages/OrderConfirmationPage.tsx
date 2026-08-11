import { useLocation, Link } from 'react-router-dom';
import { formatPrice } from '../types';
import type { Order } from '../types';
import { CheckCircle, ArrowRight, Package, MapPin, CreditCard } from 'lucide-react';
import { useLang } from '../hooks/useLang';

export function OrderConfirmationPage() {
  const { t } = useLang();
  const { state } = useLocation();
  const order = (state as { order?: Order })?.order;

  if (!order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-lg font-medium text-slate-500 dark:text-slate-400 mb-4">{t('order_not_found')}</p>
        <Link to="/products" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium text-sm">{t('order_back_to_products')}</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      {/* Success header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/30 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={32} className="text-emerald-600 dark:text-emerald-400" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('order_confirmed')}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">{t('order_confirmed_en')}</p>
        <p className="mt-4">
          <span className="text-sm text-slate-500">{t('order_number')} </span>
          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-3 py-1 rounded-md text-sm">
            {order.orderNumber}
          </span>
        </p>
      </div>

      {/* Order details */}
      <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="bg-slate-50 dark:bg-slate-800/50 px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <Package size={16} className="text-slate-400" />
          <h2 className="font-semibold text-slate-900 dark:text-white text-sm">{t('order_details')}</h2>
        </div>

        <div className="p-5">
          {order.items?.map((item) => (
            <div key={item.id} className="flex justify-between py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
              <div>
                <p className="font-medium text-slate-900 dark:text-white text-sm">{item.productTitle}</p>
                <p className="text-xs text-slate-400 mt-0.5">{item.variantSku} × {item.quantity}</p>
              </div>
              <p className="font-semibold text-slate-900 dark:text-white text-sm">{formatPrice(item.totalPriceTiyin)}</p>
            </div>
          ))}

          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400">
              <span>{t('order_vat')}</span>
              <span className="font-medium">{t('order_vat_included')}</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-lg font-bold text-slate-900 dark:text-white">{t('order_total')}</span>
              <span className="text-xl font-bold text-slate-900 dark:text-white">{formatPrice(order.totalTiyin)}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/30 px-5 py-3 flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            <MapPin size={13} /> Almaty, Kazakhstan
          </div>
          <div className="flex items-center gap-1.5">
            <CreditCard size={13} /> Kaspi Pay
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="text-center mt-8">
        <Link
          to="/products"
          className="inline-flex items-center gap-2 btn-primary px-6 py-2.5 rounded-lg font-semibold text-sm"
        >
          {t('order_shop_more')} <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}

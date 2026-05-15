import { useLocation, Link } from 'react-router-dom';
import { formatPrice } from '../types';
import type { Order } from '../types';
import { useState, useEffect } from 'react';
import { CheckCircle, ArrowRight, Package, MapPin, CreditCard } from 'lucide-react';
import { useLang } from '../hooks/useLang';

function ConfettiEffect() {
  const colors = ['#FFD700', '#0066CC', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
  const [pieces] = useState(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 2,
      color: colors[i % colors.length],
      size: 6 + Math.random() * 8,
      rotation: Math.random() * 360,
    }))
  );

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {pieces.map(p => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            backgroundColor: p.color,
            width: `${p.size}px`,
            height: `${p.size}px`,
            borderRadius: p.id % 3 === 0 ? '50%' : p.id % 3 === 1 ? '2px' : '0',
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
}

export function OrderConfirmationPage() {
  const { t } = useLang();
  const { state } = useLocation();
  const order = (state as { order?: Order })?.order;
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  if (!order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center animate-fade-in">
        <p className="text-7xl mb-4">🤔</p>
        <p className="text-xl font-semibold text-gray-500 dark:text-gray-400 mb-4">{t('order_not_found')}</p>
        <Link to="/products" className="text-kz-blue hover:underline font-medium">{t('order_back_to_products')}</Link>
      </div>
    );
  }

  return (
    <>
      {showConfetti && <ConfettiEffect />}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 animate-fade-in-up">
        {/* Success header */}
        <div className="text-center mb-10">
          <div className="relative inline-block">
            {/* Pulse ring */}
            <div className="absolute inset-0 bg-green-400/20 rounded-full animate-ping" />
            <div className="relative w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/25">
              <CheckCircle size={48} className="text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">{t('order_confirmed')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">{t('order_confirmed_en')}</p>
          <p className="mt-3">
            {t('order_number')}{' '}
            <span className="font-mono font-extrabold text-kz-blue text-lg bg-kz-blue/5 px-3 py-1 rounded-lg">
              {order.orderNumber}
            </span>
          </p>
        </div>

        {/* Order details receipt */}
        <div className="bg-white dark:bg-[#14141F]/80 rounded-2xl overflow-hidden border border-gray-100 dark:border-white/5 shadow-sm">
          {/* Header */}
          <div className="bg-gradient-to-r from-kz-blue to-kz-blue-dark p-5 flex items-center gap-3">
            <Package size={20} className="text-white" />
            <h2 className="font-bold text-white">{t('order_details')}</h2>
          </div>

          {/* Items */}
          <div className="p-6">
            {order.items?.map((item) => (
              <div key={item.id} className="flex justify-between py-3.5 border-b border-gray-100 dark:border-white/5 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-kz-blue/10 to-kz-gold/5 rounded-lg flex items-center justify-center text-lg">
                    📦
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{item.productTitle}</p>
                    <p className="text-xs text-gray-400">{item.variantSku} × {item.quantity}</p>
                  </div>
                </div>
                <p className="font-semibold text-gray-900 dark:text-white">{formatPrice(item.totalPriceTiyin)}</p>
              </div>
            ))}

            {/* Totals */}
            <div className="mt-4 pt-4 border-t-2 border-gray-100 dark:border-white/5 space-y-2">
              <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>{t('order_vat')}</span>
                <span className="font-medium">{t('order_vat_included')}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-xl font-extrabold text-gray-900 dark:text-white">{t('order_total')}</span>
                <span className="text-2xl font-extrabold text-kz-blue">{formatPrice(order.totalTiyin)}</span>
              </div>
            </div>
          </div>

          {/* Footer info */}
          <div className="bg-gray-50 dark:bg-white/[0.02] px-6 py-4 flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1.5">
              <MapPin size={14} /> Алматы, Қазақстан
            </div>
            <div className="flex items-center gap-1.5">
              <CreditCard size={14} /> Kaspi Pay
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="text-center mt-10">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 btn-primary text-white px-8 py-3.5 rounded-2xl font-bold"
          >
            {t('order_shop_more')} <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </>
  );
}

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Cart, CartItemData } from '../types';
import * as cartApi from '../api/cart';
import * as orderApi from '../api/orders';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';
import { useLang } from '../hooks/useLang';
import { formatPrice } from '../types';
import { Minus, Plus, X, Tag, ShoppingBag, Lock, ArrowRight, Download } from 'lucide-react';

export function CartPage() {
  const { t } = useLang();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState('');
  const [promo, setPromo] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const fetchCart = async () => {
    try {
      const data = await cartApi.getCart();
      setCart(data);
    } catch { /* not auth */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCart(); }, []);

  const updateQty = async (id: number, qty: number) => {
    if (qty < 1) return;
    await cartApi.updateCartItem(id, qty);
    await fetchCart();
  };

  const removeItem = async (id: number) => {
    await cartApi.removeCartItem(id);
    addToast(t('cart_item_removed'), 'info');
    await fetchCart();
  };

  const handlePromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (promo.toLowerCase() === 'shop10') {
      setPromoApplied(true);
      addToast(t('promo_applied'), 'success');
    } else if (promo) {
      addToast(t('promo_invalid'), 'error');
    }
  };

  const handleCheckout = async () => {
    setCheckingOut(true);
    setError('');
    try {
      const order = await orderApi.checkout('self_pickup', 'Almaty, Kazakhstan');
      navigate('/order-confirmation', { state: { order } });
    } catch (err: any) {
      setError(err?.response?.data?.message || t('cart_checkout_error'));
    } finally {
      setCheckingOut(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center animate-fade-in">
        <Lock size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
        <p className="text-xl font-semibold text-gray-500 dark:text-gray-400 mb-4">{t('cart_login_required')}</p>
        <Link to="/products" className="text-kz-blue hover:underline font-medium">{t('cart_back_to_products')}</Link>
      </div>
    );
  }

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
      {[1,2,3].map(i => <div key={i} className="skeleton h-20 rounded-xl" />)}
    </div>
  );

  const items = cart?.items || [];

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center animate-fade-in">
        <ShoppingBag size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
        <p className="text-xl font-semibold text-gray-500 dark:text-gray-400 mb-4">{t('cart_empty')}</p>
        <Link to="/products" className="inline-flex items-center gap-2 btn-primary text-white px-6 py-3 rounded-xl font-semibold">
          {t('cart_go_to_products')} <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  const totalItems = items.reduce((s: number, i: CartItemData) => s + i.quantity, 0);

  // Calculate total from enriched variant data
  const subtotal = items.reduce((sum: number, item: CartItemData) => {
    const price = item.variant?.priceTiyin || 0;
    return sum + price * item.quantity;
  }, 0);

  const discount = promoApplied ? Math.round(subtotal * 0.1) : 0;
  const total = subtotal - discount;

  const hasDigital = items.some((item: CartItemData) => {
    // Rough check — if variant sku contains software-related keywords
    const sku = item.variant?.sku?.toLowerCase() || '';
    return sku.includes('windows') || sku.includes('kaspersly') || sku.includes('office')
      || sku.includes('steam') || sku.includes('adobe') || sku.includes('photoshop');
  });

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-24 md:pb-8 animate-fade-in-up">
      <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-8 flex items-center gap-3">
        <ShoppingBag size={28} className="text-kz-blue" />
        {t('cart_title')}
        <span className="text-sm font-normal text-gray-400">({totalItems} {t('cart_items_count')})</span>
      </h1>

      {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl mb-6 animate-scale-in">{error}</div>}

      {/* Digital products notice */}
      {hasDigital && (
        <div className="bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 p-4 rounded-xl mb-6 flex items-center gap-3">
          <Download size={18} />
          <span className="text-sm font-medium">{t('cart_digital_notice')}</span>
        </div>
      )}

      {/* Items */}
      <div className="space-y-3">
        {items.map((item: CartItemData) => {
          const productTitle = item.variant?.product?.title || `${t('variant')} #${item.variantId}`;
          const price = item.variant?.priceTiyin || 0;
          const lineTotal = price * item.quantity;
          const sku = item.variant?.sku || '';
          const isDigitalItem = ['windows', 'kaspersly', 'office', 'steam', 'adobe', 'photoshop'].some(k => sku.includes(k));

          return (
            <div key={item.id} className="bg-white dark:bg-[#14141F]/80 rounded-2xl p-4 flex items-center gap-4 border border-blue-100/60 dark:border-white/5 shadow-sm card-hover">
              <div className={`w-16 h-16 bg-gradient-to-br ${isDigitalItem ? 'from-violet-500/20 to-purple-500/10' : 'from-kz-blue/20 to-kz-gold/10'} rounded-xl flex items-center justify-center text-2xl flex-shrink-0`}>
                {isDigitalItem ? '💾' : '📦'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white truncate">{productTitle}</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  SKU: {sku || `VAR-${item.variantId}`}
                  {isDigitalItem && <span className="ml-2 text-violet-400 text-xs font-medium">📱 {t('digital_label')}</span>}
                </p>
                {price > 0 && <p className="text-sm font-semibold text-kz-blue mt-0.5">{formatPrice(price)}</p>}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => updateQty(item.id, item.quantity - 1)}
                  className="w-8 h-8 rounded-lg border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 transition"
                >
                  <Minus size={14} />
                </button>
                <span className="w-8 text-center font-semibold text-gray-900 dark:text-white">{item.quantity}</span>
                <button
                  onClick={() => updateQty(item.id, item.quantity + 1)}
                  className="w-8 h-8 rounded-lg border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 transition"
                >
                  <Plus size={14} />
                </button>
              </div>
              <div className="text-right min-w-[80px]">
                <p className="font-bold text-gray-900 dark:text-white">{formatPrice(lineTotal)}</p>
              </div>
              <button
                onClick={() => removeItem(item.id)}
                className="p-2 text-gray-300 hover:text-red-500 transition-all"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-8 bg-white dark:bg-[#14141F]/80 rounded-2xl p-6 border border-blue-100/60 dark:border-white/5 shadow-sm">
        {/* Promo code */}
        <form onSubmit={handlePromo} className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Tag size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t('promo_placeholder')}
              value={promo}
              onChange={e => setPromo(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-blue-50/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none input-premium text-gray-900 dark:text-white placeholder-gray-400"
            />
          </div>
          <button type="submit" className="px-5 py-2.5 bg-kz-blue/10 text-kz-blue font-semibold rounded-xl text-sm hover:bg-kz-blue/20 transition-all">
            {t('promo_apply')}
          </button>
        </form>
        {promoApplied && (
          <div className="flex items-center gap-2 text-green-500 text-sm mb-4 animate-fade-in">
            <Tag size={14} /> {t('promo_applied_label')}
          </div>
        )}

        <div className="space-y-3">
          <div className="flex justify-between text-gray-500 dark:text-gray-400">
            <span>{t('cart_total_items')}</span>
            <span className="font-medium text-gray-900 dark:text-white">{totalItems}</span>
          </div>
          <div className="flex justify-between text-gray-500 dark:text-gray-400">
            <span>{t('cart_subtotal')}</span>
            <span className="font-medium text-gray-900 dark:text-white">{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-gray-500 dark:text-gray-400">
            <span>{t('cart_shipping')}</span>
            <span className="font-medium text-green-500">{t('cart_shipping_free')}</span>
          </div>
          {promoApplied && (
            <div className="flex justify-between text-green-500">
              <span>{t('cart_discount')}</span>
              <span className="font-medium">-{formatPrice(discount)}</span>
            </div>
          )}
          <div className="border-t border-blue-100/60 dark:border-white/5 shadow-sm pt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-gray-900 dark:text-white">{t('cart_total')}</span>
              <span className="text-2xl font-extrabold text-kz-blue animate-fade-in">{formatPrice(total)}</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleCheckout}
          disabled={checkingOut}
          className="w-full mt-6 btn-primary text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {checkingOut ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {t('cart_processing')}
            </>
          ) : (
            <>{t('cart_checkout')} <ArrowRight size={18} /></>
          )}
        </button>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Cart, CartItemData } from '../types';
import * as cartApi from '../api/cart';
import * as orderApi from '../api/orders';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';
import { useLang } from '../hooks/useLang';
import { formatPrice } from '../types';
import { Minus, Plus, X, Tag, ShoppingBag, Lock, ArrowRight, Package } from 'lucide-react';

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
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <Lock size={40} className="mx-auto mb-4 text-slate-300 dark:text-slate-700" />
        <p className="text-lg font-medium text-slate-500 dark:text-slate-400 mb-4">{t('cart_login_required')}</p>
        <Link to="/products" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium text-sm">{t('cart_back_to_products')}</Link>
      </div>
    );
  }

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-3">
      {[1,2,3].map(i => <div key={i} className="skeleton h-20 rounded-xl" />)}
    </div>
  );

  const items = cart?.items || [];

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <ShoppingBag size={40} className="mx-auto mb-4 text-slate-300 dark:text-slate-700" />
        <p className="text-lg font-medium text-slate-500 dark:text-slate-400 mb-4">{t('cart_empty')}</p>
        <Link to="/products" className="inline-flex items-center gap-2 btn-primary px-5 py-2.5 rounded-lg font-semibold text-sm">
          {t('cart_go_to_products')} <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  const totalItems = items.reduce((s: number, i: CartItemData) => s + i.quantity, 0);
  const subtotal = items.reduce((sum: number, item: CartItemData) => {
    const price = item.variant?.priceTiyin || 0;
    return sum + price * item.quantity;
  }, 0);

  const discount = promoApplied ? Math.round(subtotal * 0.1) : 0;
  const total = subtotal - discount;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-24 md:pb-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2.5">
        <ShoppingBag size={22} className="text-slate-400" />
        {t('cart_title')}
        <span className="text-sm font-normal text-slate-400">({totalItems} {t('cart_items_count')})</span>
      </h1>

      {error && <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-3 rounded-lg mb-6 text-sm">{error}</div>}

      {/* Items */}
      <div className="space-y-2">
        {items.map((item: CartItemData) => {
          const productTitle = item.variant?.product?.title || `${t('variant')} #${item.variantId}`;
          const price = item.variant?.priceTiyin || 0;
          const lineTotal = price * item.quantity;
          const sku = item.variant?.sku || '';

          return (
            <div key={item.id} className="bg-white dark:bg-slate-900 rounded-xl p-4 flex items-center gap-4 border border-slate-200 dark:border-slate-800">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
                <Package size={18} className="text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 dark:text-white truncate text-sm">{productTitle}</p>
                <p className="text-xs text-slate-400 mt-0.5">SKU: {sku || `VAR-${item.variantId}`}</p>
                {price > 0 && <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-0.5">{formatPrice(price)}</p>}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => updateQty(item.id, item.quantity - 1)}
                  className="w-7 h-7 rounded-md border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Minus size={12} />
                </button>
                <span className="w-7 text-center font-semibold text-slate-900 dark:text-white text-sm">{item.quantity}</span>
                <button
                  onClick={() => updateQty(item.id, item.quantity + 1)}
                  className="w-7 h-7 rounded-md border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Plus size={12} />
                </button>
              </div>
              <div className="text-right min-w-[70px]">
                <p className="font-bold text-slate-900 dark:text-white text-sm">{formatPrice(lineTotal)}</p>
              </div>
              <button
                onClick={() => removeItem(item.id)}
                className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-6 bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800">
        <form onSubmit={handlePromo} className="flex gap-2 mb-5">
          <div className="relative flex-1">
            <Tag size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t('promo_placeholder')}
              value={promo}
              onChange={e => setPromo(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none input-focus text-slate-900 dark:text-white placeholder-slate-400"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-lg text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            {t('promo_apply')}
          </button>
        </form>
        {promoApplied && (
          <div className="flex items-center gap-2 text-emerald-600 text-sm mb-4">
            <Tag size={13} /> {t('promo_applied_label')}
          </div>
        )}

        <div className="space-y-2.5">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">{t('cart_total_items')}</span>
            <span className="font-medium text-slate-900 dark:text-white">{totalItems}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">{t('cart_subtotal')}</span>
            <span className="font-medium text-slate-900 dark:text-white">{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">{t('cart_shipping')}</span>
            <span className="font-medium text-emerald-600">{t('cart_shipping_free')}</span>
          </div>
          {promoApplied && (
            <div className="flex justify-between text-sm text-emerald-600">
              <span>{t('cart_discount')}</span>
              <span className="font-medium">-{formatPrice(discount)}</span>
            </div>
          )}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-3">
            <div className="flex justify-between items-center">
              <span className="text-base font-bold text-slate-900 dark:text-white">{t('cart_total')}</span>
              <span className="text-xl font-bold text-slate-900 dark:text-white">{formatPrice(total)}</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleCheckout}
          disabled={checkingOut}
          className="w-full mt-5 btn-primary py-3 rounded-lg font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {checkingOut ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {t('cart_processing')}
            </>
          ) : (
            <>{t('cart_checkout')} <ArrowRight size={16} /></>
          )}
        </button>
      </div>
    </div>
  );
}

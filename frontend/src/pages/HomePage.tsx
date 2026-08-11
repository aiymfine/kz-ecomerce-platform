import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { Product } from '../types';
import { getProducts } from '../api/storefront';
import { formatPrice, getProductInitials, getPlaceholderColors, isDigitalProduct } from '../types';
import { ArrowRight, Shield, Truck, Headphones, Package, TrendingUp, Store, Users } from 'lucide-react';
import { useLang } from '../hooks/useLang';

export function HomePage() {
  const { t } = useLang();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProducts()
      .then((data: any) => {
        const items = data?.data || data || [];
        setProducts(Array.isArray(items) ? items.slice(0, 8) : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* ===== HERO ===== */}
      <section className="bg-gradient-to-b from-slate-900 to-slate-800 dark:from-slate-900 dark:to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-3 py-1 mb-5">
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
              <span className="text-indigo-300 text-xs font-medium">{t('hero_badge')}</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-5 leading-tight tracking-tight">
              {t('hero_title')}{' '}
              <span className="text-indigo-400">{t('hero_title_highlight')}</span>
            </h1>
            <p className="text-slate-300 text-base md:text-lg mb-8 leading-relaxed">
              {t('hero_subtitle')} {t('hero_subtitle_extra')}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/products"
                className="group inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
              >
                {t('hero_cta')}
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                to="/products"
                className="inline-flex items-center gap-2 border border-slate-600 text-slate-200 px-6 py-3 rounded-lg font-semibold hover:bg-slate-800 transition-colors"
              >
                {t('hero_cta2')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 -mt-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { num: '1,000+', label: t('stat_products'), icon: Package },
            { num: '24/7', label: t('stat_support'), icon: Headphones },
            { num: '2 days', label: t('stat_delivery'), icon: Truck },
            { num: 'Secure', label: t('stat_payment'), icon: Shield },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg flex items-center justify-center flex-shrink-0">
                  <s.icon size={16} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white">{s.num}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{s.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FEATURED PRODUCTS ===== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{t('featured_title')}</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">{t('featured_subtitle')}</p>
          </div>
          <Link to="/products" className="group flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-medium text-sm hover:gap-2 transition-all">
            {t('featured_see_all')} <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="rounded-xl overflow-hidden">
                <div className="skeleton h-44 mb-3" />
                <div className="skeleton h-4 w-3/4 mb-2" />
                <div className="skeleton h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {products.map((product) => {
              const price = product.variants?.[0]?.priceTiyin || 0;
              const initials = getProductInitials(product);
              const colors = getPlaceholderColors(product);
              const digital = isDigitalProduct(product);
              return (
                <Link
                  key={product.id}
                  to={`/products/${product.slug}`}
                  className="group bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 card-hover"
                >
                  {/* Image placeholder */}
                  <div className={`h-44 ${colors.bg} flex items-center justify-center relative`}>
                    <span className={`text-2xl font-bold ${colors.text}`}>{initials}</span>
                    {digital && (
                      <div className="absolute top-2 right-2 bg-indigo-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded">
                        DIGITAL
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-medium text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1 text-sm">{product.title}</h3>
                    {price > 0 && (
                      <p className="text-slate-900 dark:text-white font-bold text-base mt-1.5">{formatPrice(price)}</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg flex items-center justify-center mb-4">
              <Truck size={18} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{t('feature_free_shipping')}</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{t('feature_free_shipping_desc')}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg flex items-center justify-center mb-4">
              <Shield size={18} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{t('feature_warranty')}</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{t('feature_warranty_desc')}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg flex items-center justify-center mb-4">
              <Headphones size={18} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{t('feature_support_247')}</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{t('feature_support_247_desc')}</p>
          </div>
        </div>
      </section>

      {/* ===== MERCHANT CTA ===== */}
      <section className="bg-slate-900 dark:bg-slate-900 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center">
                <Store size={22} className="text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Start selling today</h3>
                <p className="text-slate-400 text-sm">Open your store and reach customers across Kazakhstan</p>
              </div>
            </div>
            <Link
              to="/merchant/register"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-indigo-700 transition-colors whitespace-nowrap"
            >
              Become a Merchant <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

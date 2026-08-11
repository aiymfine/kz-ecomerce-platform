import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Product } from '../types';
import { getProductBySlug } from '../api/storefront';
import { formatPrice, getProductInitials, getPlaceholderColors, isDigitalProduct } from '../types';
import { useCartContext } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';
import { useLang } from '../hooks/useLang';
import { Shield, Truck, RotateCcw, Minus, Plus, ChevronLeft, ShoppingCart, Download, Check, Star } from 'lucide-react';

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useLang();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeTab, setActiveTab] = useState<'desc' | 'reviews'>('desc');
  const { addItem } = useCartContext();
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    if (slug) {
      getProductBySlug(slug)
        .then((d: any) => setProduct(d?.data || d || null))
        .finally(() => setLoading(false));
    }
  }, [slug]);

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="skeleton h-96 rounded-xl" />
        <div className="space-y-4">
          <div className="skeleton h-8 w-3/4" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-2/3" />
          <div className="skeleton h-10 w-1/3" />
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="max-w-7xl mx-auto px-4 py-20 text-center">
      <p className="text-xl font-medium text-slate-500 dark:text-slate-400">{t('product_not_found')}</p>
      <Link to="/products" className="text-indigo-600 dark:text-indigo-400 hover:underline mt-4 inline-block font-medium text-sm">{t('back_to_catalog')}</Link>
    </div>
  );

  const variants = product.variants || [];
  const variant = variants[selectedVariant] || variants[0];
  const price = variant?.priceTiyin || 0;
  const digital = isDigitalProduct(product);
  const initials = getProductInitials(product);
  const colors = getPlaceholderColors(product);

  const colors_list = [...new Set(variants.map(v => v.attributeValues?.find(a => a.attribute.type === 'color')?.value).filter(Boolean))];
  const sizes = [...new Set(variants.map(v => v.attributeValues?.find(a => a.attribute.type === 'size')?.value).filter(Boolean))];

  const handleAdd = async () => {
    if (!variant) return;
    await addItem(variant.id, quantity);
    setAdded(true);
    addToast(`${product.title} ${t('added_to_cart')}`, 'success');
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-24 md:pb-8">
      <Link to="/products" className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-6 font-medium text-sm transition-colors">
        <ChevronLeft size={14} /> {t('back_to_catalog')}
      </Link>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Image */}
        <div>
          <div className={`${colors.bg} rounded-xl h-80 md:h-[440px] flex items-center justify-center`}>
            <span className={`text-5xl md:text-6xl font-bold ${colors.text}`}>{initials}</span>
          </div>
          {digital && (
            <div className="mt-3 inline-flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-sm font-medium px-3 py-1.5 rounded-lg">
              <Download size={14} /> {t('digital_product')}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{product.title}</h1>

          <p className="text-slate-600 dark:text-slate-300 mt-4 leading-relaxed text-sm">{product.description}</p>

          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-6">{formatPrice(price)}</p>

          {/* Trust badges */}
          {!digital && (
            <div className="flex flex-wrap gap-4 mt-5">
              <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                <Truck size={14} className="text-emerald-500" /> {t('detail_free_shipping')}
              </div>
              <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                <Shield size={14} className="text-indigo-500" /> {t('detail_1yr_warranty')}
              </div>
              <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                <RotateCcw size={14} className="text-slate-400" /> {t('detail_14day_return')}
              </div>
            </div>
          )}

          {/* Variant Selection */}
          {variants.length > 1 && (
            <div className="mt-6 space-y-4">
              {colors_list.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('color_label')}</p>
                  <div className="flex gap-2">
                    {variants.map((v, i) => {
                      const color = v.attributeValues?.find(a => a.attribute.type === 'color')?.value;
                      return color ? (
                        <button key={i} onClick={() => setSelectedVariant(i)}
                          className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                            selectedVariant === i
                              ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                              : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400'
                          }`}>
                          {color}
                        </button>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
              {sizes.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('size_label')}</p>
                  <div className="flex gap-2">
                    {variants.map((v, i) => {
                      const size = v.attributeValues?.find(a => a.attribute.type === 'size')?.value;
                      return size ? (
                        <button key={i} onClick={() => setSelectedVariant(i)}
                          className={`w-12 h-12 rounded-lg border text-sm font-semibold transition-colors ${
                            selectedVariant === i
                              ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                              : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400'
                          }`}>
                          {size}
                        </button>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
              {digital && variants.length > 1 && !colors_list.length && !sizes.length && (
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('variant_label')}</p>
                  <div className="flex gap-2">
                    {variants.map((v, i) => (
                      <button key={i} onClick={() => setSelectedVariant(i)}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                          selectedVariant === i
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                            : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400'
                        }`}>
                        {formatPrice(v.priceTiyin)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quantity + Add to Cart */}
          {variant && (
            <div className="flex items-center gap-3 mt-8">
              <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded-lg">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2.5 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <Minus size={14} />
                </button>
                <span className="px-3 py-2.5 font-semibold min-w-[2.5rem] text-center text-slate-900 dark:text-white text-sm">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="p-2.5 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <Plus size={14} />
                </button>
              </div>
              {isAuthenticated ? (
                <button
                  onClick={handleAdd}
                  className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
                    added
                      ? 'bg-emerald-600 text-white'
                      : 'btn-primary'
                  }`}
                >
                  {digital ? <Download size={16} /> : added ? <Check size={16} /> : <ShoppingCart size={16} />}
                  {added ? t('btn_added') : digital ? t('btn_buy_digital') : t('btn_add_to_cart')}
                </button>
              ) : (
                <p className="text-sm text-slate-400">{t('login_to_add')}</p>
              )}
            </div>
          )}

          {variant && <p className="text-xs text-slate-400 mt-3">SKU: {variant.sku}</p>}
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-12">
        <div className="flex gap-6 border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('desc')}
            className={`pb-3 text-sm font-semibold transition-colors ${activeTab === 'desc' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400' : 'text-slate-400'}`}
          >
            {t('tab_description')}
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 text-sm font-semibold transition-colors ${activeTab === 'reviews' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400' : 'text-slate-400'}`}
          >
            {t('tab_reviews')}
          </button>
        </div>

        <div className="mt-6">
          {activeTab === 'desc' ? (
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">{product.description || t('no_description')}</p>
              <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3 mt-6">
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-sm text-slate-500">{t('detail_warranty')}</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">{digital ? t('detail_digital_warranty') : t('detail_warranty_value')}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-sm text-slate-500">{t('detail_delivery')}</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">{digital ? t('detail_digital_delivery') : t('detail_delivery_value')}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-sm text-slate-500">SKU</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-white font-mono">{variant?.sku}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-sm text-slate-500">{t('detail_type')}</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">{digital ? t('detail_type_digital') : t('detail_type_physical')}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                <div className="text-3xl font-bold text-slate-900 dark:text-white">4.7</div>
                <div>
                  <div className="flex">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} size={14} className={s <= 5 ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} />
                    ))}
                  </div>
                  <p className="text-sm text-slate-400 mt-0.5">Based on 42 reviews</p>
                </div>
              </div>
              <p className="text-slate-400 text-sm text-center py-8">Reviews will appear here once customers share their experience.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

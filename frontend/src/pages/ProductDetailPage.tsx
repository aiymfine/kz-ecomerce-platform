import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Product } from '../types';
import { getProductBySlug } from '../api/storefront';
import { formatPrice, getProductEmoji, getPlaceholderGradient, isDigitalProduct } from '../types';
import { useCartContext } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';
import { useLang } from '../hooks/useLang';
import { Star, Heart, Shield, Truck, RotateCcw, Minus, Plus, ChevronLeft, ShoppingCart, Download, Zap } from 'lucide-react';

const fakeReviews = [
  { name: 'Айдана К.', rating: 5, text: 'Өте жақсы сапа! Жеткізу тез болды.', date: '2026-05-10' },
  { name: 'Данияр М.', rating: 4, text: 'Бағасы қолжетімді, сапасы жақсы.', date: '2026-05-08' },
  { name: 'Сара Т.', rating: 5, text: 'Керемет! Барлығына кеңес беремін.', date: '2026-05-05' },
];

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
        <div className="skeleton h-96 rounded-2xl" />
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
    <div className="max-w-7xl mx-auto px-4 py-20 text-center animate-fade-in">
      <p className="text-7xl mb-4">😕</p>
      <p className="text-xl font-semibold text-gray-500 dark:text-gray-400">{t('product_not_found')}</p>
      <Link to="/products" className="text-kz-blue hover:underline mt-4 inline-block font-medium">{t('back_to_catalog')}</Link>
    </div>
  );

  const variants = product.variants || [];
  const variant = variants[selectedVariant] || variants[0];
  const price = variant?.priceTiyin || 0;
  const digital = isDigitalProduct(product);
  const emoji = getProductEmoji(product);
  const gradient = getPlaceholderGradient(product);

  const colors = [...new Set(variants.map(v => v.attributeValues?.find(a => a.attribute.type === 'color')?.value).filter(Boolean))];
  const sizes = [...new Set(variants.map(v => v.attributeValues?.find(a => a.attribute.type === 'size')?.value).filter(Boolean))];

  const handleAdd = async () => {
    if (!variant) return;
    await addItem(variant.id, quantity);
    setAdded(true);
    addToast(`${product.title} ${t('added_to_cart')}`, 'success');
    setTimeout(() => setAdded(false), 2000);
  };

  const avgRating = 4.7;
  const reviewCount = 42;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-24 md:pb-8 animate-fade-in-up">
      <Link to="/products" className="inline-flex items-center gap-1 text-kz-blue hover:underline mb-6 font-medium text-sm">
        <ChevronLeft size={16} /> {t('back_to_catalog')}
      </Link>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Image */}
        <div className="relative">
          <div className={`${gradient} bg-gradient-to-br rounded-3xl h-80 md:h-[480px] flex items-center justify-center relative overflow-hidden group`}>
            <span className="text-[120px] md:text-[160px] group-hover:scale-105 transition-transform duration-700">{emoji}</span>
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
            {digital && (
              <div className="absolute top-4 left-4 bg-violet-500 text-white text-sm font-bold px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5">
                <Download size={14} /> {t('digital_product')}
              </div>
            )}
          </div>
          {/* Thumbnail strip */}
          <div className="flex gap-3 mt-4">
            {[0, 1, 2].map(i => (
              <div key={i} className={`w-16 h-16 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center cursor-pointer opacity-60 hover:opacity-100 transition-opacity ${i === 0 ? 'opacity-100 ring-2 ring-kz-blue' : ''}`}>
                <span className="text-2xl">{emoji}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div>
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">{product.title}</h1>
            <button className="p-2.5 rounded-xl border border-blue-200 dark:border-white/10 text-gray-400 hover:text-red-500 hover:border-red-200 transition-all flex-shrink-0">
              <Heart size={20} />
            </button>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2 mt-3">
            <div className="flex">
              {[1,2,3,4,5].map(s => (
                <Star key={s} size={16} className={s <= Math.round(avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'} />
              ))}
            </div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{avgRating} ({reviewCount} {t('reviews_count')})</span>
          </div>

          <p className="text-gray-500 dark:text-gray-400 mt-4 leading-relaxed">{product.description}</p>

          <p className="text-4xl font-extrabold text-kz-blue mt-6">{formatPrice(price)}</p>

          {/* Digital product info OR physical trust badges */}
          {digital ? (
            <div className="mt-6 space-y-3">
              <div className="bg-violet-50 dark:bg-violet-900/20 rounded-xl p-4 border border-violet-100 dark:border-violet-500/20">
                <h4 className="font-semibold text-violet-700 dark:text-violet-300 mb-2 flex items-center gap-2">
                  <Download size={16} /> {t('digital_delivery_title')}
                </h4>
                <ul className="space-y-1.5 text-sm text-violet-600 dark:text-violet-400">
                  <li className="flex items-center gap-2"><Zap size={14} /> {t('digital_instant_delivery')}</li>
                  <li className="flex items-center gap-2"><MailIcon size={14} /> {t('digital_email_delivery')}</li>
                  <li className="flex items-center gap-2"><Shield size={14} /> {t('digital_guarantee')}</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-4 mt-6">
              <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                <Truck size={14} className="text-green-500" /> {t('detail_free_shipping')}
              </div>
              <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                <Shield size={14} className="text-blue-500" /> {t('detail_1yr_warranty')}
              </div>
              <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                <RotateCcw size={14} className="text-purple-500" /> {t('detail_14day_return')}
              </div>
            </div>
          )}

          {/* Variant Selection */}
          {variants.length > 1 && (
            <div className="mt-6 space-y-4">
              {colors.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('color_label')}</p>
                  <div className="flex gap-2">
                    {variants.map((v, i) => {
                      const color = v.attributeValues?.find(a => a.attribute.type === 'color')?.value;
                      return color ? (
                        <button key={i} onClick={() => setSelectedVariant(i)}
                          className={`px-5 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                            selectedVariant === i
                              ? 'border-kz-blue bg-kz-blue/5 text-kz-blue dark:bg-kz-blue/10'
                              : 'border-blue-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-gray-300'
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
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('size_label')}</p>
                  <div className="flex gap-2">
                    {variants.map((v, i) => {
                      const size = v.attributeValues?.find(a => a.attribute.type === 'size')?.value;
                      return size ? (
                        <button key={i} onClick={() => setSelectedVariant(i)}
                          className={`w-14 h-14 rounded-xl border-2 text-sm font-semibold transition-all ${
                            selectedVariant === i
                              ? 'border-kz-blue bg-kz-blue/5 text-kz-blue dark:bg-kz-blue/10'
                              : 'border-blue-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                          }`}>
                          {size}
                        </button>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
              {/* Subscription/duration variant selector for digital products */}
              {digital && variants.length > 1 && !colors.length && !sizes.length && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('variant_label')}</p>
                  <div className="flex gap-2">
                    {variants.map((v, i) => (
                      <button key={i} onClick={() => setSelectedVariant(i)}
                        className={`px-5 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                          selectedVariant === i
                            ? digital ? 'border-violet-500 bg-violet-500/5 text-violet-600 dark:bg-violet-500/10' : 'border-kz-blue bg-kz-blue/5 text-kz-blue'
                            : 'border-blue-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-gray-300'
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
            <div className="flex items-center gap-4 mt-8">
              <div className="flex items-center border-2 border-blue-200 dark:border-white/10 rounded-xl overflow-hidden">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-3 text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 transition">
                  <Minus size={16} />
                </button>
                <span className="px-4 py-3 font-semibold min-w-[3rem] text-center text-gray-900 dark:text-white">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="p-3 text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 transition">
                  <Plus size={16} />
                </button>
              </div>
              {isAuthenticated ? (
                <button
                  onClick={handleAdd}
                  className={`flex-1 py-3.5 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                    added
                      ? 'bg-green-500 text-white shadow-lg shadow-green-500/25'
                      : digital
                        ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:shadow-lg hover:shadow-violet-500/25 hover:-translate-y-0.5'
                        : 'btn-primary text-white'
                  }`}
                >
                  {digital ? <Download size={18} /> : <ShoppingCart size={18} />}
                  {added ? t('btn_added') : digital ? t('btn_buy_digital') : t('btn_add_to_cart')}
                </button>
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500">{t('login_to_add')}</p>
              )}
            </div>
          )}

          {variant && <p className="text-sm text-gray-400 dark:text-gray-500 mt-3">SKU: {variant.sku}</p>}
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-16">
        <div className="flex gap-6 border-b border-blue-200 dark:border-white/10">
          <button
            onClick={() => setActiveTab('desc')}
            className={`pb-3 font-semibold transition-all ${activeTab === 'desc' ? 'text-kz-blue border-b-2 border-kz-blue' : 'text-gray-400 dark:text-gray-500'}`}
          >
            {t('tab_description')}
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 font-semibold transition-all ${activeTab === 'reviews' ? 'text-kz-blue border-b-2 border-kz-blue' : 'text-gray-400 dark:text-gray-500'}`}
          >
            {t('tab_reviews')} ({reviewCount})
          </button>
        </div>

        <div className="mt-6 animate-fade-in">
          {activeTab === 'desc' ? (
            <div className="bg-white dark:bg-[#14141F]/80 rounded-2xl p-6 border border-blue-100/60 dark:border-white/5 shadow-sm">
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{product.description || t('no_description')}</p>
              <div className="grid sm:grid-cols-2 gap-4 mt-6">
                <div className="flex justify-between py-2 border-b border-blue-100/60 dark:border-white/5 shadow-sm">
                  <span className="text-gray-500 dark:text-gray-400">{t('detail_warranty')}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{digital ? t('detail_digital_warranty') : t('detail_warranty_value')}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-blue-100/60 dark:border-white/5 shadow-sm">
                  <span className="text-gray-500 dark:text-gray-400">{t('detail_delivery')}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{digital ? t('detail_digital_delivery') : t('detail_delivery_value')}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-blue-100/60 dark:border-white/5 shadow-sm">
                  <span className="text-gray-500 dark:text-gray-400">SKU</span>
                  <span className="font-medium text-gray-900 dark:text-white font-mono">{variant?.sku}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-blue-100/60 dark:border-white/5 shadow-sm">
                  <span className="text-gray-500 dark:text-gray-400">{t('detail_type')}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{digital ? t('detail_type_digital') : t('detail_type_physical')}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {fakeReviews.map((review, i) => (
                <div key={i} className="bg-white dark:bg-[#14141F]/80 rounded-2xl p-5 border border-blue-100/60 dark:border-white/5 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-kz-blue to-kz-gold rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {review.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{review.name}</p>
                        <p className="text-xs text-gray-400">{review.date}</p>
                      </div>
                    </div>
                    <div className="flex">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} size={12} className={s <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">{review.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MailIcon({ size }: { size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2"/>
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  );
}

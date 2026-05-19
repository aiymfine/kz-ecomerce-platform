import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Product, Category } from '../types';
import { getProducts, getCategories } from '../api/storefront';
import { formatPrice, getProductEmoji, getPlaceholderGradient, isDigitalProduct } from '../types';
import { useCartContext } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';
import { useLang } from '../hooks/useLang';
import { Search, Star, Heart, ShoppingCart, SlidersHorizontal, Download, Package } from 'lucide-react';

export function ProductsPage() {
  const { t } = useLang();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc' | 'name'>('default');
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [productType, setProductType] = useState<'all' | 'physical' | 'digital'>('all');
  const { addItem } = useCartContext();
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();

  const badges = [t('badge_new'), t('badge_hit'), '-20%', t('badge_new'), undefined, '-10%', '🎮', '🛡️', '📋', '🎨'];

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getProducts().then((d: any) => {
        const items = d?.data || d || [];
        setProducts(Array.isArray(items) ? items : []);
      }),
      getCategories().then((d: any) => {
        const cats = d || [];
        setCategories(Array.isArray(cats) ? cats : []);
      }).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const filtered = products.filter(p => {
    // Search filter
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase());
    // Type filter
    const digital = isDigitalProduct(p);
    const matchType = productType === 'all' || (productType === 'digital' && digital) || (productType === 'physical' && !digital);
    // Category filter
    const matchCategory = activeCategory === null || p.categories?.some(c => c.category?.id === activeCategory);
    return matchSearch && matchType && matchCategory;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'price-asc') return (a.variants?.[0]?.priceTiyin || 0) - (b.variants?.[0]?.priceTiyin || 0);
    if (sortBy === 'price-desc') return (b.variants?.[0]?.priceTiyin || 0) - (a.variants?.[0]?.priceTiyin || 0);
    if (sortBy === 'name') return a.title.localeCompare(b.title);
    return 0;
  });

  const handleAddToCart = async (variantId: number, title: string) => {
    await addItem(variantId);
    addToast(`${title} ${t('added_to_cart')}`, 'success');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">{t('products_title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{filtered.length} {t('product_found')}</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t('search_placeholder')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full sm:w-72 pl-10 pr-4 py-2.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl input-premium outline-none text-gray-900 dark:text-white placeholder-gray-400"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2.5 rounded-xl border transition-all ${showFilters ? 'bg-kz-blue text-white border-kz-blue' : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500'}`}
          >
            <SlidersHorizontal size={18} />
          </button>
        </div>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => { setActiveCategory(null); setProductType('all'); }}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeCategory === null && productType === 'all'
              ? 'bg-kz-blue text-white shadow-md'
              : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-100 dark:border-white/5'
          }`}
        >
          {t('category_all')}
        </button>
        <button
          onClick={() => { setActiveCategory(null); setProductType('physical'); }}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
            productType === 'physical'
              ? 'bg-kz-blue text-white shadow-md'
              : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-100 dark:border-white/5'
          }`}
        >
          <Package size={14} /> {t('category_physical')}
        </button>
        <button
          onClick={() => { setActiveCategory(null); setProductType('digital'); }}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
            productType === 'digital'
              ? 'bg-violet-600 text-white shadow-md'
              : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-100 dark:border-white/5'
          }`}
        >
          <Download size={14} /> {t('category_digital')}
        </button>
        {categories.filter(c => c.slug !== 'all').map(cat => (
          <button
            key={cat.id}
            onClick={() => { setActiveCategory(cat.id === activeCategory ? null : cat.id); setProductType('all'); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeCategory === cat.id
                ? 'bg-kz-blue text-white shadow-md'
                : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-100 dark:border-white/5'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white dark:bg-[#14141F]/80 rounded-2xl p-5 mb-6 animate-fade-in-up flex flex-wrap items-center gap-3 border border-gray-100 dark:border-white/5 shadow-sm">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('sort_label')}</span>
          {([
            ['default', t('sort_default')],
            ['price-asc', t('sort_price_asc')],
            ['price-desc', t('sort_price_desc')],
            ['name', t('sort_name')],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                sortBy === key
                  ? 'bg-kz-blue text-white shadow-md'
                  : 'bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="rounded-2xl overflow-hidden bg-white dark:bg-transparent">
              <div className="skeleton h-44 mb-3" />
              <div className="skeleton h-4 w-3/4 mb-2" />
              <div className="skeleton h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sorted.map((product, idx) => {
            const gradient = getPlaceholderGradient(product);
            const badge = badges[idx % badges.length];
            const price = product.variants?.[0]?.priceTiyin || 0;
            const rating = [4.8, 4.9, 4.7, 4.5, 4.6, 4.8, 4.3, 4.9, 4.4, 4.7][idx % 10];
            const emoji = getProductEmoji(product);
            const digital = isDigitalProduct(product);

            return (
              <div
                key={product.id}
                className="bg-white dark:bg-[#14141F]/80 rounded-2xl overflow-hidden card-hover border border-gray-100 dark:border-white/5 group relative"
              >
                {/* Wishlist */}
                <button
                  onClick={e => { e.preventDefault(); e.stopPropagation(); }}
                  className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 dark:bg-white/10 backdrop-blur-sm flex items-center justify-center text-gray-400 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                >
                  <Heart size={14} />
                </button>

                {/* Badge */}
                {badge && (
                  <div className={`absolute top-3 left-3 z-10 ${digital ? 'bg-violet-500' : 'bg-kz-gold'} text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1`}>
                    {digital && <Download size={10} />}
                    {badge}
                  </div>
                )}

                {/* Digital badge when no other badge */}
                {!badge && digital && (
                  <div className="absolute top-3 left-3 z-10 bg-violet-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1">
                    <Download size={10} /> {t('digital_label')}
                  </div>
                )}

                <Link to={`/products/${product.slug}`}>
                  <div className={`h-44 bg-gradient-to-br ${gradient} flex items-center justify-center relative overflow-hidden`}>
                    <span className="text-5xl group-hover:scale-110 transition-transform duration-500">{emoji}</span>
                    {digital && (
                      <div className="absolute bottom-2 right-2 bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                        DIGITAL
                      </div>
                    )}
                  </div>
                </Link>

                <div className="p-4">
                  <Link to={`/products/${product.slug}`}>
                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-kz-blue transition-colors line-clamp-1">{product.title}</h3>
                  </Link>
                  {/* Rating */}
                  <div className="flex items-center gap-1 mt-1">
                    <div className="flex">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} size={11} className={s <= Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'} />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{rating}</span>
                  </div>
                  {price > 0 && <p className="text-kz-blue font-extrabold text-lg mt-1.5">{formatPrice(price)}</p>}
                  {isAuthenticated && product.variants?.[0] && (
                    <button
                      onClick={() => handleAddToCart(product.variants![0].id, product.title)}
                      className="mt-3 w-full flex items-center justify-center gap-2 btn-primary text-white py-2.5 rounded-xl text-sm font-semibold"
                    >
                      <ShoppingCart size={14} />
                      {digital ? t('btn_buy_digital') : t('btn_add_to_cart')}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-20 animate-fade-in">
          <p className="text-7xl mb-4">🔍</p>
          <p className="text-xl font-semibold text-gray-500 dark:text-gray-400">{t('no_products')}</p>
          <p className="text-gray-400 dark:text-gray-500 mt-2">{t('no_products_hint')}</p>
        </div>
      )}
    </div>
  );
}

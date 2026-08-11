import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Product, Category } from '../types';
import { getProducts, getCategories } from '../api/storefront';
import { formatPrice, getProductInitials, getPlaceholderColors, isDigitalProduct } from '../types';
import { useCartContext } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';
import { useLang } from '../hooks/useLang';
import { Search, ShoppingCart, SlidersHorizontal, Download, Package, X } from 'lucide-react';

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

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getProducts().then((d: any) => {
        const items = d?.data || d || [];
        setProducts(Array.isArray(items) ? items : []);
      }),
      getCategories().then((d: any) => {
        const cats = d?.data || d || [];
        setCategories(Array.isArray(cats) ? cats : []);
      }).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const filtered = products.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase());
    const digital = isDigitalProduct(p);
    const matchType = productType === 'all' || (productType === 'digital' && digital) || (productType === 'physical' && !digital);
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{t('products_title')}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-sm">{filtered.length} {t('product_found')}</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t('search_placeholder')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full sm:w-64 pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg input-focus outline-none text-slate-900 dark:text-white placeholder-slate-400 text-sm"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg border transition-colors ${showFilters ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-500'}`}
          >
            <SlidersHorizontal size={16} />
          </button>
        </div>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => { setActiveCategory(null); setProductType('all'); }}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            activeCategory === null && productType === 'all'
              ? 'bg-indigo-600 text-white'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
          }`}
        >
          {t('category_all')}
        </button>
        <button
          onClick={() => { setActiveCategory(null); setProductType('physical'); }}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
            productType === 'physical'
              ? 'bg-indigo-600 text-white'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <Package size={13} /> {t('category_physical')}
        </button>
        <button
          onClick={() => { setActiveCategory(null); setProductType('digital'); }}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
            productType === 'digital'
              ? 'bg-indigo-600 text-white'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <Download size={13} /> {t('category_digital')}
        </button>
        {categories.filter(c => c.slug !== 'all').map(cat => (
          <button
            key={cat.id}
            onClick={() => { setActiveCategory(cat.id === activeCategory ? null : cat.id); setProductType('all'); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeCategory === cat.id
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 mb-6 border border-slate-200 dark:border-slate-800 animate-fade-in-fast flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('sort_label')}</span>
          {([
            ['default', t('sort_default')],
            ['price-asc', t('sort_price_asc')],
            ['price-desc', t('sort_price_desc')],
            ['name', t('sort_name')],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                sortBy === key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="rounded-xl overflow-hidden">
              <div className="skeleton h-40 mb-3" />
              <div className="skeleton h-4 w-3/4 mb-2" />
              <div className="skeleton h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-20">
          <Package size={40} className="mx-auto mb-4 text-slate-300 dark:text-slate-700" />
          <p className="text-lg font-medium text-slate-500 dark:text-slate-400">{t('no_products')}</p>
          <p className="text-slate-400 dark:text-slate-500 mt-1 text-sm">{t('no_products_hint')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {sorted.map((product) => {
            const initials = getProductInitials(product);
            const colors = getPlaceholderColors(product);
            const price = product.variants?.[0]?.priceTiyin || 0;
            const digital = isDigitalProduct(product);

            return (
              <div
                key={product.id}
                className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 card-hover group flex flex-col"
              >
                <Link to={`/products/${product.slug}`} className="block">
                  <div className={`h-40 ${colors.bg} flex items-center justify-center relative`}>
                    <span className={`text-2xl font-bold ${colors.text}`}>{initials}</span>
                    {digital && (
                      <div className="absolute top-2 right-2 bg-indigo-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded">
                        DIGITAL
                      </div>
                    )}
                  </div>
                </Link>

                <div className="p-4 flex flex-col flex-1">
                  <Link to={`/products/${product.slug}`}>
                    <h3 className="font-medium text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1 text-sm">{product.title}</h3>
                  </Link>
                  {price > 0 && <p className="text-slate-900 dark:text-white font-bold text-base mt-1">{formatPrice(price)}</p>}
                  {isAuthenticated && product.variants?.[0] && (
                    <button
                      onClick={() => handleAddToCart(product.variants![0].id, product.title)}
                      className="mt-3 w-full flex items-center justify-center gap-1.5 btn-primary py-2 rounded-lg text-sm font-medium"
                    >
                      <ShoppingCart size={13} />
                      {digital ? t('btn_buy_digital') : t('btn_add_to_cart')}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

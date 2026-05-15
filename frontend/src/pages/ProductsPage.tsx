import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../types';
import { getProducts } from '../api/storefront';
import { formatPrice } from '../types';
import { useCartContext } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';
import { Search, Star, Heart, ShoppingCart, SlidersHorizontal } from 'lucide-react';

const placeholders = [
  { bg: 'from-blue-500 to-cyan-500', emoji: '📱' },
  { bg: 'from-purple-500 to-pink-500', emoji: '🎧' },
  { bg: 'from-emerald-500 to-teal-500', emoji: '👟' },
  { bg: 'from-orange-500 to-amber-500', emoji: '🎒' },
  { bg: 'from-rose-500 to-pink-500', emoji: '📱' },
  { bg: 'from-violet-500 to-indigo-500', emoji: '🎧' },
];

const badges = ['Жаңа', 'Хит', '-20%', 'Жаңа', undefined, '-10%'];
const fakeRatings = [4.8, 4.9, 4.7, 4.5, 4.6, 4.8, 4.3, 4.9];

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc' | 'name'>('default');
  const { addItem } = useCartContext();
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    getProducts()
      .then((d: any) => {
        const items = d?.data || d || [];
        setProducts(Array.isArray(items) ? items : []);
      }).finally(() => setLoading(false));
  }, []);

  const filtered = products.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'price-asc') return (a.variants?.[0]?.priceTiyin || 0) - (b.variants?.[0]?.priceTiyin || 0);
    if (sortBy === 'price-desc') return (b.variants?.[0]?.priceTiyin || 0) - (a.variants?.[0]?.priceTiyin || 0);
    if (sortBy === 'name') return a.title.localeCompare(b.title);
    return 0;
  });

  const handleAddToCart = async (variantId: number, title: string) => {
    await addItem(variantId);
    addToast(`${title} себетке қосылды!`, 'success');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Өнімдер</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{filtered.length} тауар табылды</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Іздеу..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full sm:w-72 pl-10 pr-4 py-2.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-kz-blue/50 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400"
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

      {/* Filters */}
      {showFilters && (
        <div className="glass-card rounded-2xl p-5 mb-6 animate-fade-in-up flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Сұрыптау:</span>
          {([
            ['default', 'Әдепкі'],
            ['price-asc', 'Арзан → Қымбат'],
            ['price-desc', 'Қымбат → Арзан'],
            ['name', 'Аты бойынша'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                sortBy === key
                  ? 'bg-kz-blue text-white shadow-md'
                  : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'
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
            <div key={i} className="rounded-2xl overflow-hidden">
              <div className="skeleton h-44 mb-3" />
              <div className="skeleton h-4 w-3/4 mb-2" />
              <div className="skeleton h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sorted.map((product, idx) => {
            const ph = placeholders[idx % placeholders.length];
            const badge = badges[idx % badges.length];
            const price = product.variants?.[0]?.priceTiyin || 0;
            const rating = fakeRatings[idx % fakeRatings.length];
            return (
              <div
                key={product.id}
                className="glass-card rounded-2xl overflow-hidden hover:-translate-y-2 hover:shadow-xl transition-all duration-300 group relative"
              >
                {/* Wishlist */}
                <button
                  onClick={e => { e.preventDefault(); e.stopPropagation(); }}
                  className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/80 dark:bg-white/10 backdrop-blur-sm flex items-center justify-center text-gray-400 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                >
                  <Heart size={14} />
                </button>

                {/* Badge */}
                {badge && (
                  <div className="absolute top-3 left-3 z-10 bg-kz-gold text-gray-900 text-xs font-bold px-2.5 py-1 rounded-lg shadow-md">
                    {badge}
                  </div>
                )}

                <Link to={`/products/${product.slug}`}>
                  <div className={`h-44 bg-gradient-to-br ${ph.bg} flex items-center justify-center relative overflow-hidden`}>
                    <span className="text-5xl group-hover:scale-110 transition-transform duration-500">{ph.emoji}</span>
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
                      className="mt-3 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-kz-blue to-kz-blue-dark text-white py-2.5 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-kz-blue/25 transition-all"
                    >
                      <ShoppingCart size={14} />
                      Себетке қосу
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
          <p className="text-xl font-semibold text-gray-500 dark:text-gray-400">Өнім табылмады</p>
          <p className="text-gray-400 dark:text-gray-500 mt-2">Басқа кілт сөзді қолданып көріңіз</p>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../types';
import { getProducts } from '../api/storefront';
import { formatPrice } from '../types';
import { useCartContext } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';

const placeholders = [
  { bg: 'from-blue-500 to-blue-700', emoji: '📱' },
  { bg: 'from-purple-500 to-purple-700', emoji: '🎧' },
  { bg: 'from-green-500 to-green-700', emoji: '👟' },
  { bg: 'from-orange-500 to-orange-700', emoji: '🎒' },
  { bg: 'from-pink-500 to-pink-700', emoji: '📱' },
  { bg: 'from-teal-500 to-teal-700', emoji: '🎧' },
];

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { addItem } = useCartContext();
  const { isAuthenticated } = useAuth();

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Өнімдер</h1>
          <p className="text-gray-500 mt-1">{filtered.length} тауар табылды</p>
        </div>
        <input
          type="text"
          placeholder="Іздеу..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-4 py-2.5 border rounded-xl w-full sm:w-72 focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
              <div className="bg-gray-200 h-40 rounded-xl mb-4"></div>
              <div className="bg-gray-200 h-4 rounded w-3/4 mb-2"></div>
              <div className="bg-gray-200 h-4 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((product, idx) => {
            const ph = placeholders[idx % placeholders.length];
            const price = product.variants?.[0]?.priceTiyin || 0;
            return (
              <div key={product.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all group">
                <Link to={`/products/${product.slug}`}>
                  <div className={`h-40 bg-gradient-to-br ${ph.bg} flex items-center justify-center`}>
                    <span className="text-5xl">{ph.emoji}</span>
                  </div>
                </Link>
                <div className="p-4">
                  <Link to={`/products/${product.slug}`}>
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition line-clamp-1">{product.title}</h3>
                  </Link>
                  {price > 0 && <p className="text-blue-600 font-bold text-lg mt-1">{formatPrice(price)}</p>}
                  {isAuthenticated && product.variants?.[0] && (
                    <button
                      onClick={() => addItem(product.variants![0].id)}
                      className="mt-3 w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                    >
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
        <div className="text-center py-16 text-gray-400">
          <p className="text-6xl mb-4">🔍</p>
          <p className="text-xl">Өнім табылмады</p>
        </div>
      )}
    </div>
  );
}

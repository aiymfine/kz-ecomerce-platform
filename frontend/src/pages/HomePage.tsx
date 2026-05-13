import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { Product } from '../types';
import { getProducts } from '../api/storefront';
import { formatPrice } from '../types';

export function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProducts()
      .then((data: any) => {
        const items = data?.data || data || [];
        setProducts(Array.isArray(items) ? items.slice(0, 6) : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const placeholders = [
    { bg: 'from-blue-500 to-blue-700', emoji: '📱', label: 'Samsung Galaxy' },
    { bg: 'from-purple-500 to-purple-700', emoji: '🎧', label: 'AirPods' },
    { bg: 'from-green-500 to-green-700', emoji: '👟', label: 'Nike' },
    { bg: 'from-orange-500 to-orange-700', emoji: '🎒', label: 'Рюкзак' },
    { bg: 'from-pink-500 to-pink-700', emoji: '📱', label: 'Чехол' },
    { bg: 'from-teal-500 to-teal-700', emoji: '🎧', label: 'Аудио' },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Сатып алу — <span className="text-yellow-400">жеңіл</span>
            </h1>
            <p className="text-blue-100 text-lg md:text-xl mb-8">
              Қазақстанның ең үздік техника және аксессуарлар дүкені. Тез жеткізу, қауіпсіз төлем.
            </p>
            <Link to="/products" className="inline-block bg-white text-blue-700 px-8 py-3 rounded-xl font-bold hover:bg-yellow-400 hover:text-blue-900 transition-all">
              Каталогты қарау →
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 -mt-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { num: '1000+', label: 'Тауар' },
            { num: '24/7', label: 'Қолдау' },
            { num: '2 күн', label: 'Жеткізу' },
            { num: 'Kaspi Pay', label: 'Төлем' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm text-center">
              <div className="text-xl font-bold text-blue-600">{s.num}</div>
              <div className="text-sm text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Танымал өнімдер</h2>
          <Link to="/products" className="text-blue-600 hover:underline font-medium">Барлығы →</Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                <div className="bg-gray-200 h-48 rounded-xl mb-4"></div>
                <div className="bg-gray-200 h-4 rounded w-3/4 mb-2"></div>
                <div className="bg-gray-200 h-4 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product, idx) => {
              const placeholder = placeholders[idx % placeholders.length];
              const price = product.variants?.[0]?.priceTiyin || 0;
              return (
                <Link key={product.id} to={`/products/${product.slug}`} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all hover:-translate-y-1">
                  <div className={`h-48 bg-gradient-to-br ${placeholder.bg} flex items-center justify-center`}>
                    <span className="text-6xl">{placeholder.emoji}</span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition">{product.title}</h3>
                    {price > 0 && (
                      <p className="text-blue-600 font-bold text-lg mt-1">{formatPrice(price)}</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

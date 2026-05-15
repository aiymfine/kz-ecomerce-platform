import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { Product } from '../types';
import { getProducts } from '../api/storefront';
import { formatPrice } from '../types';
import { ArrowRight, Star, TrendingUp, Shield, Truck, Headphones, Heart } from 'lucide-react';

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
    { bg: 'from-blue-500 to-cyan-500', emoji: '📱', label: 'Samsung Galaxy', badge: 'Жаңа' },
    { bg: 'from-purple-500 to-pink-500', emoji: '🎧', label: 'AirPods', badge: 'Хит' },
    { bg: 'from-emerald-500 to-teal-500', emoji: '👟', label: 'Nike', badge: undefined },
    { bg: 'from-orange-500 to-amber-500', emoji: '🎒', label: 'Рюкзак', badge: '-20%' },
    { bg: 'from-rose-500 to-pink-500', emoji: '📱', label: 'Чехол', badge: 'Жаңа' },
    { bg: 'from-violet-500 to-indigo-500', emoji: '🎧', label: 'Аудио', badge: undefined },
  ];

  const fakeRatings = [4.8, 4.9, 4.7, 4.5, 4.6, 4.8];
  const fakeReviews = [124, 89, 203, 56, 178, 92];

  return (
    <div>
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#001a4d] via-kz-blue-dark to-[#003366] min-h-[520px] md:min-h-[600px]">
        {/* Animated gradient orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-10 w-72 h-72 bg-kz-blue/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-kz-gold/10 rounded-full blur-3xl animate-float-delay" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-spin-slow" />
        </div>

        {/* Particles */}
        <div className="absolute inset-0">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/20 rounded-full"
              style={{
                left: `${(i * 5.3) % 100}%`,
                top: `${(i * 7.1 + 10) % 90}%`,
                animation: `particle-float ${4 + (i % 3) * 2}s ease-in-out infinite ${i * 0.5}s`,
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-28">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-1.5 mb-6 animate-fade-in-up">
              <span className="w-2 h-2 bg-kz-gold rounded-full animate-pulse" />
              <span className="text-white/80 text-sm font-medium">Жаңа платформа — 2026</span>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-tight animate-fade-in-up animate-delay-100">
              Сатып алу —{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-kz-gold to-amber-300">
                жеңіл
              </span>
            </h1>
            <p className="text-blue-100/80 text-lg md:text-xl mb-8 leading-relaxed animate-fade-in-up animate-delay-200">
              Қазақстанның ең үздік техника және аксессуарлар дүкені.
              <br className="hidden md:block" /> Тез жеткізу, қауіпсіз төлем, 24/7 қолдау.
            </p>
            <div className="flex flex-wrap gap-4 animate-fade-in-up animate-delay-300">
              <Link
                to="/products"
                className="group inline-flex items-center gap-2 bg-white text-kz-blue-dark px-8 py-3.5 rounded-2xl font-bold hover:bg-kz-gold hover:text-gray-900 transition-all duration-300 hover:shadow-xl hover:shadow-kz-gold/20 hover:-translate-y-0.5"
              >
                Каталогты қарау
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/products"
                className="inline-flex items-center gap-2 border-2 border-white/20 text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-white/10 transition-all"
              >
                Арзан бағалар
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 80V40C240 70 480 10 720 40C960 70 1200 10 1440 40V80H0Z" className="fill-gray-50 dark:fill-[#0a0a0f]" />
          </svg>
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 -mt-4 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { num: '1000+', label: 'Тауар', icon: TrendingUp, color: 'text-blue-500' },
            { num: '24/7', label: 'Қолдау', icon: Headphones, color: 'text-green-500' },
            { num: '2 күн', label: 'Жеткізу', icon: Truck, color: 'text-purple-500' },
            { num: 'Kaspi', label: 'Төлем', icon: Shield, color: 'text-kz-gold' },
          ].map((s, i) => (
            <div
              key={s.label}
              className="glass-card rounded-2xl p-5 text-center hover:-translate-y-1 transition-all duration-300 hover:shadow-lg animate-fade-in-up"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <s.icon size={24} className={`mx-auto mb-2 ${s.color}`} />
              <div className="text-xl font-extrabold text-gray-900 dark:text-white">{s.num}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FEATURED PRODUCTS ===== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white">Танымал өнімдер</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Ең көп сатылатын тауарлар</p>
          </div>
          <Link to="/products" className="group flex items-center gap-1 text-kz-blue font-semibold hover:gap-2 transition-all">
            Барлығы <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="rounded-2xl overflow-hidden">
                <div className="skeleton h-52 mb-3" />
                <div className="skeleton h-4 w-3/4 mb-2" />
                <div className="skeleton h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product, idx) => {
              const placeholder = placeholders[idx % placeholders.length];
              const price = product.variants?.[0]?.priceTiyin || 0;
              const rating = fakeRatings[idx % fakeRatings.length];
              const reviews = fakeReviews[idx % fakeReviews.length];
              return (
                <Link
                  key={product.id}
                  to={`/products/${product.slug}`}
                  className="group glass-card rounded-2xl overflow-hidden hover:-translate-y-2 hover:shadow-xl transition-all duration-300 relative"
                >
                  {/* Wishlist */}
                  <button
                    onClick={e => { e.preventDefault(); e.stopPropagation(); }}
                    className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/80 dark:bg-white/10 backdrop-blur-sm flex items-center justify-center text-gray-400 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Heart size={14} />
                  </button>

                  {/* Badge */}
                  {placeholder.badge && (
                    <div className="absolute top-3 left-3 z-10 bg-kz-gold text-gray-900 text-xs font-bold px-2.5 py-1 rounded-lg shadow-md">
                      {placeholder.badge}
                    </div>
                  )}

                  {/* Image */}
                  <div className={`h-52 bg-gradient-to-br ${placeholder.bg} flex items-center justify-center relative overflow-hidden`}>
                    <span className="text-6xl group-hover:scale-110 transition-transform duration-500">{placeholder.emoji}</span>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-kz-blue transition-colors line-clamp-1">{product.title}</h3>
                    {/* Rating */}
                    <div className="flex items-center gap-1 mt-1.5">
                      <div className="flex">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} size={12} className={s <= Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'} />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{rating} ({reviews})</span>
                    </div>
                    {price > 0 && (
                      <p className="text-kz-blue font-extrabold text-lg mt-2">{formatPrice(price)}</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ===== FEATURES BANNER ===== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <div className="bg-gradient-to-r from-kz-blue-dark via-kz-blue to-[#003366] rounded-3xl p-8 md:p-12 relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-kz-gold/10 rounded-full blur-3xl" />
          </div>
          <div className="relative grid md:grid-cols-3 gap-8 text-white">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Truck size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg">Тегін жеткізу</h3>
                <p className="text-white/60 text-sm mt-1">Қазақстан бойынша 2 күн ішінде</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg">Кепілдік</h3>
                <p className="text-white/60 text-sm mt-1">Барлық тауарға ресми кепілдік</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Headphones size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg">24/7 Қолдау</h3>
                <p className="text-white/60 text-sm mt-1">Кез келген уақытта бізбен хабарласыңыз</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

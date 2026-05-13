import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Product } from '../types';
import { getProductBySlug } from '../api/storefront';
import { formatPrice } from '../types';
import { useCartContext } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const { addItem } = useCartContext();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (slug) {
      getProductBySlug(slug)
        .then((d: any) => setProduct(d?.data || d || null))
        .finally(() => setLoading(false));
    }
  }, [slug]);

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-16 text-center text-gray-400">Жүктелуде...</div>;
  if (!product) return <div className="max-w-7xl mx-auto px-4 py-16 text-center"><p className="text-6xl mb-4">😕</p><p className="text-xl text-gray-500">Өнім табылмады</p><Link to="/products" className="text-blue-600 hover:underline mt-4 block">Каталогқа оралу</Link></div>;

  const variants = product.variants || [];
  const variant = variants[selectedVariant] || variants[0];
  const price = variant?.priceTiyin || 0;

  const colors = [...new Set(variants.map(v => v.attributeValues?.find(a => a.attribute.type === 'color')?.value).filter(Boolean))];
  const sizes = [...new Set(variants.map(v => v.attributeValues?.find(a => a.attribute.type === 'size')?.value).filter(Boolean))];

  const handleAdd = async () => {
    if (!variant) return;
    await addItem(variant.id, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const placeholder = ['from-blue-500 to-blue-700', 'from-purple-500 to-purple-700', 'from-green-500 to-green-700'][product.id % 3];
  const emoji = product.title.toLowerCase().includes('samsung') ? '📱' : product.title.toLowerCase().includes('airpod') ? '🎧' : product.title.toLowerCase().includes('nike') ? '👟' : product.title.toLowerCase().includes('рюкзак') ? '🎒' : product.title.toLowerCase().includes('чехол') ? '📱' : '📦';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <Link to="/products" className="text-blue-600 hover:underline mb-6 inline-block">← Каталогқа оралу</Link>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Image */}
        <div className={`bg-gradient-to-br ${placeholder} rounded-2xl h-80 md:h-96 flex items-center justify-center`}>
          <span className="text-9xl">{emoji}</span>
        </div>

        {/* Info */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.title}</h1>
          <p className="text-gray-500 mb-4">{product.description}</p>
          <p className="text-3xl font-bold text-blue-600 mb-6">{formatPrice(price)}</p>

          {/* Variant Selection */}
          {variants.length > 1 && (
            <div className="mb-6">
              {colors.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Түс</p>
                  <div className="flex gap-2">
                    {variants.map((v, i) => {
                      const color = v.attributeValues?.find(a => a.attribute.type === 'color')?.value;
                      return color ? (
                        <button key={i} onClick={() => setSelectedVariant(i)}
                          className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition ${selectedVariant === i ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-200 hover:border-gray-300'}`}>
                          {color}
                        </button>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
              {sizes.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Өлшем</p>
                  <div className="flex gap-2">
                    {variants.map((v, i) => {
                      const size = v.attributeValues?.find(a => a.attribute.type === 'size')?.value;
                      return size ? (
                        <button key={i} onClick={() => setSelectedVariant(i)}
                          className={`w-12 h-12 rounded-lg border-2 text-sm font-medium transition ${selectedVariant === i ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-200 hover:border-gray-300'}`}>
                          {size}
                        </button>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quantity + Add to Cart */}
          {variant && (
            <div className="flex items-center gap-4">
              <div className="flex items-center border rounded-xl overflow-hidden">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 py-3 text-gray-500 hover:bg-gray-50 transition">−</button>
                <span className="px-4 py-3 font-medium min-w-[3rem] text-center">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="px-4 py-3 text-gray-500 hover:bg-gray-50 transition">+</button>
              </div>
              {isAuthenticated ? (
                <button onClick={handleAdd}
                  className={`flex-1 py-3 rounded-xl font-bold text-lg transition ${added ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                  {added ? '✓ Қосылды!' : 'Себетке қосу'}
                </button>
              ) : (
                <p className="text-sm text-gray-400">Себетке қосу үшін кіріңіз</p>
              )}
            </div>
          )}

          {variant && <p className="text-sm text-gray-400 mt-3">SKU: {variant.sku}</p>}
        </div>
      </div>
    </div>
  );
}

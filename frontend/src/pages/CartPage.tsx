import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Cart, CartItemData } from '../types';
import * as cartApi from '../api/cart';
import * as orderApi from '../api/orders';
import { useAuth } from '../hooks/useAuth';

export function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState('');
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const fetchCart = async () => {
    try {
      const data = await cartApi.getCart();
      setCart(data);
    } catch { /* not auth */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCart(); }, []);

  const updateQty = async (id: number, qty: number) => {
    if (qty < 1) return;
    await cartApi.updateCartItem(id, qty);
    await fetchCart();
  };

  const removeItem = async (id: number) => {
    await cartApi.removeCartItem(id);
    await fetchCart();
  };

  const handleCheckout = async () => {
    setCheckingOut(true);
    setError('');
    try {
      const order = await orderApi.checkout('self_pickup', 'Алматы, Қазақстан');
      navigate('/order-confirmation', { state: { order } });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Сатып алу сәтсіз аяқталды');
    } finally {
      setCheckingOut(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-6xl mb-4">🔒</p>
        <p className="text-xl text-gray-500 mb-4">Себетті көру үшін кіріңіз</p>
        <Link to="/products" className="text-blue-600 hover:underline">Өнімдерге оралу →</Link>
      </div>
    );
  }

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-16 text-center text-gray-400">Жүктелуде...</div>;

  const items = cart?.items || [];

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-6xl mb-4">🛒</p>
        <p className="text-xl text-gray-500 mb-4">Себет бос</p>
        <Link to="/products" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition inline-block">Өнімдерге →</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Себет</h1>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6">{error}</div>}

      <div className="space-y-4">
        {items.map((item: CartItemData) => (
          <div key={item.id} className="bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">📦</div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Вариант #{item.variantId}</p>
              <p className="text-sm text-gray-400">Артикул: VAR-{item.variantId}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => updateQty(item.id, item.quantity - 1)} className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-gray-50 transition">−</button>
              <span className="w-8 text-center font-medium">{item.quantity}</span>
              <button onClick={() => updateQty(item.id, item.quantity + 1)} className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-gray-50 transition">+</button>
            </div>
            <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 transition p-1">✕</button>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-white rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <span className="text-gray-600">Тауарлар саны:</span>
          <span className="font-medium">{items.reduce((s: number, i: CartItemData) => s + i.quantity, 0)}</span>
        </div>
        <button
          onClick={handleCheckout}
          disabled={checkingOut}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {checkingOut ? 'Өңдеу...' : 'Сатып алу'}
        </button>
      </div>
    </div>
  );
}

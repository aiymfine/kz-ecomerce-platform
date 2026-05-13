import { useState, useCallback, createContext, useContext } from 'react';
import type { Cart, CartItemData } from '../types';
import * as cartApi from '../api/cart';

function useCartInner() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    setLoading(true);
    try {
      const data = await cartApi.getCart();
      setCart(data);
    } catch {
      // not authenticated or no cart
    } finally {
      setLoading(false);
    }
  }, []);

  const addItem = useCallback(async (variant_id: number, quantity: number = 1) => {
    await cartApi.addToCart(variant_id, quantity);
    await fetchCart();
  }, [fetchCart]);

  const updateItem = useCallback(async (id: number, quantity: number) => {
    await cartApi.updateCartItem(id, quantity);
    await fetchCart();
  }, [fetchCart]);

  const removeItem = useCallback(async (id: number) => {
    await cartApi.removeCartItem(id);
    await fetchCart();
  }, [fetchCart]);

  const itemCount = cart?.items?.reduce((sum: number, i: CartItemData) => sum + i.quantity, 0) ?? 0;

  return { cart, loading, itemCount, addItem, updateItem, removeItem, fetchCart };
}

const CartContext = createContext<ReturnType<typeof useCartInner> | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const cart = useCartInner();
  return <CartContext.Provider value={cart}>{children}</CartContext.Provider>;
}

export function useCartContext() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCartContext must be inside CartProvider');
  return ctx;
}

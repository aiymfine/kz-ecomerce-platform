import client from './client';
import type { Cart } from '../types';

export async function getCart(): Promise<Cart> {
  const { data } = await client.get('/stores/1/cart');
  // TransformInterceptor wraps in { data: ... }
  return data?.data || data;
}

export async function addToCart(variant_id: number, quantity: number = 1): Promise<any> {
  const { data } = await client.post('/stores/1/cart/items', { variant_id, quantity });
  return data?.data || data;
}

export async function updateCartItem(id: number, quantity: number): Promise<any> {
  const { data } = await client.patch(`/stores/1/cart/items/${id}`, { quantity });
  return data?.data || data;
}

export async function removeCartItem(id: number): Promise<any> {
  const { data } = await client.delete(`/stores/1/cart/items/${id}`);
  return data?.data || data;
}

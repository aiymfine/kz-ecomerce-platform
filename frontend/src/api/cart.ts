import client from './client';
import type { Cart } from '../types';

function unwrap(res: any) {
  const d = res.data;
  if (d && typeof d === 'object' && 'data' in d && typeof d.data === 'object') {
    return d.data;
  }
  return d;
}

export async function getCart(): Promise<Cart> {
  const res = await client.get('/stores/1/cart');
  return unwrap(res);
}

export async function addToCart(variant_id: number, quantity: number = 1): Promise<any> {
  const res = await client.post('/stores/1/cart/items', { variant_id, quantity });
  return unwrap(res);
}

export async function updateCartItem(id: number, quantity: number): Promise<any> {
  const res = await client.patch(`/stores/1/cart/items/${id}`, { quantity });
  return unwrap(res);
}

export async function removeCartItem(id: number): Promise<any> {
  const res = await client.delete(`/stores/1/cart/items/${id}`);
  return unwrap(res);
}

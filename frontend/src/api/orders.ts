import client from './client';
import type { Order } from '../types';

export async function checkout(shipping_method: string = 'self_pickup', shipping_address: string = ''): Promise<Order> {
  const { data } = await client.post('/stores/1/orders/checkout', {
    shipping_method,
    shipping_address,
  });
  return data;
}

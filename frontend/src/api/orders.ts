import client from './client';

export async function checkout(shipping_method: string, shipping_address: string) {
  const { data } = await client.post('/stores/1/orders/checkout', {
    shipping_method,
    shipping_address,
  });
  return data?.data || data;
}

export async function getOrders() {
  const { data } = await client.get('/stores/1/orders');
  return data?.data || data;
}

export async function getOrder(orderNumber: string) {
  const { data } = await client.get(`/stores/1/orders/${orderNumber}`);
  return data?.data || data;
}

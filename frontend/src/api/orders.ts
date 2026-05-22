import client from './client';

function unwrap(res: any) {
  const d = res.data;
  if (d && typeof d === 'object' && 'data' in d && typeof d.data === 'object') {
    return d.data;
  }
  return d;
}

export async function checkout(shipping_method: string, shipping_address: string) {
  const res = await client.post('/stores/1/orders/checkout', {
    shipping_method,
    shipping_address,
  });
  return unwrap(res);
}

export async function getOrders() {
  const res = await client.get('/stores/1/orders');
  const d = unwrap(res);
  return Array.isArray(d) ? d : (d?.data || []);
}

export async function getOrder(orderNumber: string) {
  const res = await client.get(`/stores/1/orders/${orderNumber}`);
  return unwrap(res);
}

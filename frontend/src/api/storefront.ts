import client from './client';

function unwrap(res: any) {
  const d = res.data;
  if (d && typeof d === 'object' && 'data' in d && typeof d.data === 'object') {
    return d.data;
  }
  return d;
}

export async function getProducts(): Promise<any> {
  const res = await client.get('/storefront/products', { params: { storeId: 1 } });
  const d = unwrap(res);
  return d?.data || d;
}

export async function getProductBySlug(slug: string): Promise<any> {
  const res = await client.get(`/storefront/products/${slug}`, { params: { storeId: 1 } });
  const d = unwrap(res);
  return d?.data || d;
}

export async function getCategories(): Promise<any> {
  const res = await client.get('/storefront/categories', { params: { storeId: 1 } });
  const d = unwrap(res);
  return d?.data || d;
}

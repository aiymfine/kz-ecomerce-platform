import client from './client';

export async function getProducts(): Promise<any> {
  const { data } = await client.get('/storefront/products', { params: { storeId: 1 } });
  return data?.data || data;
}

export async function getProductBySlug(slug: string): Promise<any> {
  const { data } = await client.get(`/storefront/products/${slug}`, { params: { storeId: 1 } });
  return data?.data || data;
}

export async function getCategories(): Promise<any> {
  const { data } = await client.get('/storefront/categories', { params: { storeId: 1 } });
  return data?.data || data;
}

import client from './client';

export async function register(body: {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
  phone?: string;
}) {
  const { data } = await client.post('/storefront/auth/register', {
    storeId: 1,
    first_name: body.firstName,
    last_name: body.lastName,
    phone: body.phone,
    email: body.email,
    password: body.password,
  });
  return data;
}

export async function login(email: string, password: string) {
  const { data } = await client.post('/storefront/auth/login', {
    storeId: 1,
    email,
    password,
  });
  return data;
}

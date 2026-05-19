import client from './client';

// ---- Merchant Auth (for merchant/admin dashboard) ----

export async function merchantRegister(body: {
  email: string;
  password: string;
  name: string;
  phone?: string;
  businessName?: string;
}) {
  const { data } = await client.post('/auth/register', body);
  return data;
}

export async function merchantLogin(email: string, password: string) {
  const { data } = await client.post('/auth/login', { email, password });
  return data;
}

export async function merchantVerifyEmail(email: string, code: string) {
  const { data } = await client.post('/auth/verify-email', { email, code });
  return data;
}

export async function merchantResendVerification(email: string) {
  const { data } = await client.post('/auth/resend-verification', { email });
  return data;
}

export async function merchantForgotPassword(email: string) {
  const { data } = await client.post('/auth/forgot-password', { email });
  return data;
}

export async function merchantResetPassword(token: string, newPassword: string) {
  const { data } = await client.post('/auth/reset-password', { token, newPassword });
  return data;
}

export async function merchantLogout(refreshToken: string) {
  const { data } = await client.post('/auth/logout', { refreshToken });
  return data;
}

export async function merchantMe() {
  const { data } = await client.get('/auth/me');
  return data;
}

export async function adminLogin(email: string, password: string) {
  const { data } = await client.post('/auth/admin/login', { email, password });
  return data;
}

// ---- Customer/Storefront Auth ----

export async function customerRegister(body: {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
  phone?: string;
}) {
  const { data } = await client.post('/storefront/auth/register', {
    first_name: body.firstName,
    last_name: body.lastName,
    phone: body.phone,
    email: body.email,
    password: body.password,
  }, { params: { storeId: 1 } });
  return data;
}

export async function customerLogin(email: string, password: string) {
  const { data } = await client.post('/storefront/auth/login', {
    email,
    password,
  }, { params: { storeId: 1 } });
  return data;
}

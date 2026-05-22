import client from './client';

// ---- Merchant Auth (for merchant/admin dashboard) ----

function unwrap(res: any) {
  // TransformInterceptor wraps in { data: ... }
  // Axios also wraps in { data: ... }
  // So we have res.data = { data: { accessToken, ... } } or res.data = { accessToken, ... }
  const d = res.data;
  if (d && typeof d === 'object' && 'data' in d && typeof d.data === 'object') {
    return d.data;
  }
  return d;
}

export async function merchantRegister(body: {
  email: string;
  password: string;
  name: string;
  phone?: string;
  businessName?: string;
}) {
  const res = await client.post('/auth/register', body);
  return unwrap(res);
}

export async function merchantLogin(email: string, password: string) {
  const res = await client.post('/auth/login', { email, password });
  return unwrap(res);
}

export async function merchantVerifyEmail(email: string, code: string) {
  const res = await client.post('/auth/verify-email', { email, code });
  return unwrap(res);
}

export async function merchantResendVerification(email: string) {
  const res = await client.post('/auth/resend-verification', { email });
  return unwrap(res);
}

export async function merchantForgotPassword(email: string) {
  const res = await client.post('/auth/forgot-password', { email });
  return unwrap(res);
}

export async function merchantResetPassword(token: string, newPassword: string) {
  const res = await client.post('/auth/reset-password', { token, newPassword });
  return unwrap(res);
}

export async function merchantLogout(refreshToken: string) {
  const res = await client.post('/auth/logout', { refreshToken });
  return unwrap(res);
}

export async function merchantMe() {
  const res = await client.get('/auth/me');
  return unwrap(res);
}

export async function adminLogin(email: string, password: string) {
  const res = await client.post('/auth/admin/login', { email, password });
  return unwrap(res);
}

// ---- Customer/Storefront Auth ----

export async function customerRegister(body: {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
  phone?: string;
}) {
  const res = await client.post('/storefront/auth/register', {
    first_name: body.firstName,
    last_name: body.lastName,
    phone: body.phone,
    email: body.email,
    password: body.password,
  }, { params: { storeId: 1 } });
  return unwrap(res);
}

export async function customerLogin(email: string, password: string) {
  const res = await client.post('/storefront/auth/login', {
    email,
    password,
  }, { params: { storeId: 1 } });
  return unwrap(res);
}

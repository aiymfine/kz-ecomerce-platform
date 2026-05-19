import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import type { Customer } from '../types';
import * as authApi from '../api/auth';

function useAuthInner() {
  const [user, setUser] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const saved = localStorage.getItem('auth_user');
    if (token && saved) {
      try { setUser(JSON.parse(saved)); } catch { /* ignore */ }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.customerLogin(email, password);
    const d = res.data || res;
    localStorage.setItem('auth_token', d.accessToken);
    localStorage.setItem('auth_refresh', d.refreshToken);
    localStorage.setItem('auth_user', JSON.stringify(d.customer));
    setUser(d.customer);
  }, []);

  const register = useCallback(async (body: {
    email: string; password: string; firstName: string; lastName: string; phone: string;
  }) => {
    const res = await authApi.customerRegister(body);
    const d = res.data || res;
    localStorage.setItem('auth_token', d.accessToken);
    localStorage.setItem('auth_refresh', d.refreshToken);
    localStorage.setItem('auth_user', JSON.stringify(d.customer));
    setUser(d.customer);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_refresh');
    localStorage.removeItem('auth_user');
    setUser(null);
  }, []);

  return { user, loading, isAuthenticated: !!user, login, register, logout };
}

const AuthContext = createContext<ReturnType<typeof useAuthInner> | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthInner();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}

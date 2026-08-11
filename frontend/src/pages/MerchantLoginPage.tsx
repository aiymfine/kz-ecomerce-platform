import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useLang } from '../hooks/useLang';
import { useToast } from '../components/Toast';
import { LogIn, ArrowRight, Store } from 'lucide-react';

export function MerchantLoginPage() {
  const { t } = useLang();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await client.post('/auth/login', {
        email: form.email,
        password: form.password,
      });
      const d = res.data?.data || res.data;
      const token = d?.accessToken;
      const merchant = d?.merchant;

      if (token && merchant) {
        localStorage.setItem('merchant_token', token);
        localStorage.setItem('merchant_user', JSON.stringify(merchant));
        addToast(t('merchant_login_success'), 'success');
        navigate('/merchant/dashboard');
      } else {
        addToast(t('auth_login_error'), 'error');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || t('auth_login_error');
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Store size={22} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            {t('merchant_login_title')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            {t('merchant_login_desc')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 space-y-3">
          <input type="email" placeholder={t('auth_email_placeholder')} value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required
            className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none input-focus text-slate-900 dark:text-white placeholder-slate-400 text-sm" />
          <input type="password" placeholder={t('auth_password_placeholder')} value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required
            className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none input-focus text-slate-900 dark:text-white placeholder-slate-400 text-sm" />

          <button type="submit" disabled={loading}
            className="w-full btn-primary py-2.5 rounded-lg font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? '...' : <>{t('merchant_login_btn')} <ArrowRight size={14} /></>}
          </button>
        </form>

        <div className="mt-5 text-center space-y-2">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('merchant_no_account')}{' '}
            <Link to="/merchant/register" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
              {t('auth_register')}
            </Link>
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/forgot-password" className="text-xs text-slate-400 hover:text-indigo-600 transition-colors">
              {t('forgot_title')}
            </Link>
            <Link to="/verify-email" className="text-xs text-slate-400 hover:text-indigo-600 transition-colors">
              {t('verify_title')}
            </Link>
          </div>
          <Link to="/" className="text-xs text-slate-400 hover:text-indigo-600 transition-colors block">
            ← {t('verify_back')}
          </Link>
        </div>

        <p className="text-xs text-slate-400 dark:text-slate-500 mt-4 text-center">
          {t('merchant_demo_hint')}
        </p>
      </div>
    </div>
  );
}

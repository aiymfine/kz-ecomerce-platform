import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useLang } from '../hooks/useLang';
import { useToast } from '../components/Toast';
import { LogIn, ArrowRight } from 'lucide-react';

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
      // TransformInterceptor wraps in { data: ... }
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
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 animate-fade-in-up">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-kz-blue to-kz-blue-dark rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <LogIn size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
            {t('merchant_login_title')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
            {t('merchant_login_desc')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-[#14141F]/80 rounded-2xl p-6 border border-blue-100/60 dark:border-white/5 shadow-sm space-y-4">
          <input type="email" placeholder={t('auth_email_placeholder')} value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required
            className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl outline-none text-gray-900 dark:text-white placeholder-gray-400 focus:border-kz-blue transition" />
          <input type="password" placeholder={t('auth_password_placeholder')} value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required
            className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl outline-none text-gray-900 dark:text-white placeholder-gray-400 focus:border-kz-blue transition" />

          <button type="submit" disabled={loading}
            className="w-full bg-gradient-to-r from-kz-blue to-kz-blue-dark text-white py-3 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? '...' : <>{t('merchant_login_btn')} <ArrowRight size={16} /></>}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('merchant_no_account')}{' '}
            <Link to="/merchant/register" className="text-kz-blue font-semibold hover:underline">
              {t('auth_register')}
            </Link>
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/forgot-password" className="text-xs text-gray-400 hover:text-kz-blue transition">
              {t('forgot_title')}
            </Link>
            <Link to="/verify-email" className="text-xs text-gray-400 hover:text-kz-blue transition">
              {t('verify_title')}
            </Link>
          </div>
          <Link to="/" className="text-xs text-gray-400 hover:text-kz-blue transition block">
            ← {t('verify_back')}
          </Link>
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500 mt-4 text-center">
          {t('merchant_demo_hint')}
        </p>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useLang } from '../hooks/useLang';
import { useToast } from '../components/Toast';
import { UserPlus, ArrowRight, Store } from 'lucide-react';

export function MerchantRegisterPage() {
  const { t } = useLang();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    businessName: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      addToast(t('reset_mismatch'), 'error');
      return;
    }
    if (form.password.length < 8) {
      addToast(t('reset_weak'), 'error');
      return;
    }
    setLoading(true);
    try {
      await client.post('/auth/register', {
        email: form.email,
        password: form.password,
        name: form.name,
        phone: form.phone || undefined,
        businessName: form.businessName || undefined,
      });
      addToast(t('merchant_register_success'), 'success');
      navigate('/merchant/login');
    } catch (err: any) {
      const msg = err?.response?.data?.message || t('auth_register_error');
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Store size={22} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            {t('merchant_register_title')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            {t('merchant_register_desc')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 space-y-3">
          <input type="text" placeholder={t('merchant_name_placeholder')} value={form.name} onChange={set('name')} required
            className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none input-focus text-slate-900 dark:text-white placeholder-slate-400 text-sm" />
          <input type="email" placeholder={t('auth_email_placeholder')} value={form.email} onChange={set('email')} required
            className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none input-focus text-slate-900 dark:text-white placeholder-slate-400 text-sm" />
          <input type="tel" placeholder={t('auth_phone_placeholder')} value={form.phone} onChange={set('phone')}
            className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none input-focus text-slate-900 dark:text-white placeholder-slate-400 text-sm" />
          <input type="text" placeholder={t('merchant_business_placeholder')} value={form.businessName} onChange={set('businessName')}
            className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none input-focus text-slate-900 dark:text-white placeholder-slate-400 text-sm" />
          <input type="password" placeholder={t('auth_password_placeholder')} value={form.password} onChange={set('password')} required minLength={8}
            className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none input-focus text-slate-900 dark:text-white placeholder-slate-400 text-sm" />
          <input type="password" placeholder={t('merchant_confirm_password')} value={form.confirmPassword} onChange={set('confirmPassword')} required
            className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none input-focus text-slate-900 dark:text-white placeholder-slate-400 text-sm" />

          <button type="submit" disabled={loading}
            className="w-full btn-primary py-2.5 rounded-lg font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? '...' : <>{t('merchant_register_btn')} <ArrowRight size={14} /></>}
          </button>
        </form>

        <div className="mt-5 text-center space-y-2">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('merchant_has_account')}{' '}
            <Link to="/merchant/login" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
              {t('auth_login')}
            </Link>
          </p>
          <Link to="/" className="text-xs text-slate-400 hover:text-indigo-600 transition-colors block">
            ← {t('verify_back')}
          </Link>
        </div>
      </div>
    </div>
  );
}

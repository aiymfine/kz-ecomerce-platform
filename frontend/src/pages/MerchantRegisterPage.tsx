import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useLang } from '../hooks/useLang';
import { useToast } from '../components/Toast';
import { UserPlus, Store, ArrowRight } from 'lucide-react';

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
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 animate-fade-in-up">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-kz-blue to-kz-blue-dark rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <UserPlus size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
            {t('merchant_register_title')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
            {t('merchant_register_desc')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-[#14141F]/80 rounded-2xl p-6 border border-blue-100/60 dark:border-white/5 shadow-sm space-y-4">
          <input type="text" placeholder={t('merchant_name_placeholder')} value={form.name} onChange={set('name')} required
            className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl outline-none text-gray-900 dark:text-white placeholder-gray-400 focus:border-kz-blue transition" />
          <input type="email" placeholder={t('auth_email_placeholder')} value={form.email} onChange={set('email')} required
            className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl outline-none text-gray-900 dark:text-white placeholder-gray-400 focus:border-kz-blue transition" />
          <input type="tel" placeholder={t('auth_phone_placeholder')} value={form.phone} onChange={set('phone')}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl outline-none text-gray-900 dark:text-white placeholder-gray-400 focus:border-kz-blue transition" />
          <input type="text" placeholder={t('merchant_business_placeholder')} value={form.businessName} onChange={set('businessName')}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl outline-none text-gray-900 dark:text-white placeholder-gray-400 focus:border-kz-blue transition" />
          <input type="password" placeholder={t('auth_password_placeholder')} value={form.password} onChange={set('password')} required minLength={8}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl outline-none text-gray-900 dark:text-white placeholder-gray-400 focus:border-kz-blue transition" />
          <input type="password" placeholder={t('merchant_confirm_password')} value={form.confirmPassword} onChange={set('confirmPassword')} required
            className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl outline-none text-gray-900 dark:text-white placeholder-gray-400 focus:border-kz-blue transition" />

          <button type="submit" disabled={loading}
            className="w-full bg-gradient-to-r from-kz-blue to-kz-blue-dark text-white py-3 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? '...' : <>{t('merchant_register_btn')} <ArrowRight size={16} /></>}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('merchant_has_account')}{' '}
            <Link to="/merchant/login" className="text-kz-blue font-semibold hover:underline">
              {t('auth_login')}
            </Link>
          </p>
          <Link to="/" className="text-xs text-gray-400 hover:text-kz-blue transition block">
            ← {t('verify_back')}
          </Link>
        </div>
      </div>
    </div>
  );
}

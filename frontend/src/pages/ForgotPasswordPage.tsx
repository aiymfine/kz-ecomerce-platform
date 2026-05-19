import { useState } from 'react';
import { Link } from 'react-router-dom';
import * as authApi from '../api/auth';
import { useToast } from '../components/Toast';
import { useLang } from '../hooks/useLang';
import { KeyRound, ArrowLeft, Mail } from 'lucide-react';

export function ForgotPasswordPage() {
  const { t } = useLang();
  const { addToast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authApi.merchantForgotPassword(email);
      setSent(true);
      addToast(t('forgot_sent'), 'success');
    } catch (err: any) {
      setError(err?.response?.data?.message || t('forgot_error'));
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center animate-fade-in">
        <div className="w-20 h-20 bg-kz-blue/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Mail size={36} className="text-kz-blue" />
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-3">{t('forgot_sent_title')}</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-2">{t('forgot_sent_desc')}</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">{email}</p>
        <Link to="/reset-password" className="text-kz-blue hover:underline font-medium">
          {t('forgot_go_reset')}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16 animate-fade-in-up">
      <div className="bg-white dark:bg-[#14141F]/80 rounded-2xl p-8 border border-gray-100 dark:border-white/5 shadow-sm">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <KeyRound size={24} className="text-amber-600" />
          </div>
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-white">{t('forgot_title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{t('forgot_desc')}</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder={t('auth_email_placeholder')}
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl input-premium outline-none text-gray-900 dark:text-white placeholder-gray-400"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary text-white py-3 rounded-xl font-semibold disabled:opacity-50"
          >
            {loading ? '...' : t('forgot_submit')}
          </button>
        </form>

        <Link to="/" className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mt-6 justify-center">
          <ArrowLeft size={14} /> {t('forgot_back')}
        </Link>
      </div>
    </div>
  );
}

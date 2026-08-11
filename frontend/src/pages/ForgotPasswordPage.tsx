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
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950/30 rounded-full flex items-center justify-center mx-auto mb-5">
          <Mail size={28} className="text-indigo-600 dark:text-indigo-400" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t('forgot_sent_title')}</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">{t('forgot_sent_desc')}</p>
        <p className="text-sm text-slate-400 mb-6">{email}</p>
        <Link to="/reset-password" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium text-sm">
          {t('forgot_go_reset')}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
        <div className="text-center mb-5">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/30 rounded-xl flex items-center justify-center mx-auto mb-4">
            <KeyRound size={22} className="text-amber-600 dark:text-amber-400" />
          </div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">{t('forgot_title')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('forgot_desc')}</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder={t('auth_email_placeholder')}
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg input-focus outline-none text-slate-900 dark:text-white placeholder-slate-400 text-sm"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-2.5 rounded-lg font-semibold text-sm disabled:opacity-50"
          >
            {loading ? '...' : t('forgot_submit')}
          </button>
        </form>

        <Link to="/" className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 mt-5 justify-center">
          <ArrowLeft size={13} /> {t('forgot_back')}
        </Link>
      </div>
    </div>
  );
}

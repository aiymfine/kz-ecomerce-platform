import { useState } from 'react';
import { Link } from 'react-router-dom';
import * as authApi from '../api/auth';
import { useToast } from '../components/Toast';
import { useLang } from '../hooks/useLang';
import { Mail, ArrowLeft, RefreshCw, CheckCircle } from 'lucide-react';

export function VerifyEmailPage() {
  const { t } = useLang();
  const { addToast } = useToast();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authApi.merchantVerifyEmail(email, code);
      setVerified(true);
      addToast(t('verify_success'), 'success');
    } catch (err: any) {
      setError(err?.response?.data?.message || t('verify_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) { setError(t('verify_enter_email')); return; }
    setResendLoading(true);
    try {
      await authApi.merchantResendVerification(email);
      addToast(t('verify_resent'), 'success');
    } catch (err: any) {
      setError(err?.response?.data?.message || t('verify_resend_error'));
    } finally {
      setResendLoading(false);
    }
  };

  if (verified) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center animate-fade-in">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-green-500" />
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-3">{t('verify_success_title')}</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">{t('verify_success_desc')}</p>
        <Link to="/" className="btn-primary text-white px-6 py-3 rounded-xl font-semibold inline-block">
          {t('verify_go_login')}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16 animate-fade-in-up">
      <div className="bg-white dark:bg-[#14141F]/80 rounded-2xl p-8 border border-gray-100 dark:border-white/5 shadow-sm">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-kz-blue/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Mail size={24} className="text-kz-blue" />
          </div>
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-white">{t('verify_title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{t('verify_desc')}</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <input
            type="email"
            placeholder={t('auth_email_placeholder')}
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl input-premium outline-none text-gray-900 dark:text-white placeholder-gray-400"
          />
          <input
            type="text"
            placeholder={t('verify_code_placeholder')}
            value={code}
            onChange={e => setCode(e.target.value)}
            required
            maxLength={6}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl input-premium outline-none text-gray-900 dark:text-white placeholder-gray-400 text-center text-2xl tracking-[0.5em] font-mono"
          />
          <button
            type="submit"
            disabled={loading || code.length < 6}
            className="w-full btn-primary text-white py-3 rounded-xl font-semibold disabled:opacity-50"
          >
            {loading ? '...' : t('verify_submit')}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={handleResend}
            disabled={resendLoading}
            className="text-sm text-kz-blue hover:underline disabled:opacity-50 flex items-center gap-1 mx-auto"
          >
            <RefreshCw size={14} className={resendLoading ? 'animate-spin' : ''} />
            {t('verify_resend')}
          </button>
        </div>

        <Link to="/" className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mt-6 justify-center">
          <ArrowLeft size={14} /> {t('verify_back')}
        </Link>

        <p className="text-xs text-gray-400 dark:text-gray-500 mt-4 text-center">
          {t('verify_demo_hint')}
        </p>
      </div>
    </div>
  );
}

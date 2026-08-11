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
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/30 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={28} className="text-emerald-600 dark:text-emerald-400" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t('verify_success_title')}</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">{t('verify_success_desc')}</p>
        <Link to="/" className="btn-primary px-5 py-2.5 rounded-lg font-semibold text-sm inline-block">
          {t('verify_go_login')}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
        <div className="text-center mb-5">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Mail size={22} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">{t('verify_title')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('verify_desc')}</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-3">
          <input
            type="email"
            placeholder={t('auth_email_placeholder')}
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg input-focus outline-none text-slate-900 dark:text-white placeholder-slate-400 text-sm"
          />
          <input
            type="text"
            placeholder={t('verify_code_placeholder')}
            value={code}
            onChange={e => setCode(e.target.value)}
            required
            maxLength={6}
            className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg input-focus outline-none text-slate-900 dark:text-white placeholder-slate-400 text-center text-xl tracking-[0.5em] font-mono"
          />
          <button
            type="submit"
            disabled={loading || code.length < 6}
            className="w-full btn-primary py-2.5 rounded-lg font-semibold text-sm disabled:opacity-50"
          >
            {loading ? '...' : t('verify_submit')}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={handleResend}
            disabled={resendLoading}
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50 flex items-center gap-1 mx-auto"
          >
            <RefreshCw size={13} className={resendLoading ? 'animate-spin' : ''} />
            {t('verify_resend')}
          </button>
        </div>

        <Link to="/" className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 mt-5 justify-center">
          <ArrowLeft size={13} /> {t('verify_back')}
        </Link>

        <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 text-center">
          {t('verify_demo_hint')}
        </p>
      </div>
    </div>
  );
}

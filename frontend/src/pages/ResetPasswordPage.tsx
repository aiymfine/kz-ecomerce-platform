import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import * as authApi from '../api/auth';
import { useToast } from '../components/Toast';
import { useLang } from '../hooks/useLang';
import { KeyRound, ArrowLeft, CheckCircle, Eye, EyeOff } from 'lucide-react';

export function ResetPasswordPage() {
  const { t } = useLang();
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState(searchParams.get('token') || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError(t('reset_mismatch'));
      return;
    }
    if (newPassword.length < 8) {
      setError(t('reset_weak'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authApi.merchantResetPassword(token, newPassword);
      setSuccess(true);
      addToast(t('reset_success'), 'success');
    } catch (err: any) {
      setError(err?.response?.data?.message || t('reset_error'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/30 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={28} className="text-emerald-600 dark:text-emerald-400" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t('reset_success_title')}</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">{t('reset_success_desc')}</p>
        <Link to="/" className="btn-primary px-5 py-2.5 rounded-lg font-semibold text-sm inline-block">
          {t('reset_go_login')}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
        <div className="text-center mb-5">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl flex items-center justify-center mx-auto mb-4">
            <KeyRound size={22} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">{t('reset_title')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('reset_desc')}</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {!token && (
            <input
              type="text"
              placeholder={t('reset_token_placeholder')}
              value={token}
              onChange={e => setToken(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg input-focus outline-none text-slate-900 dark:text-white placeholder-slate-400 font-mono text-sm"
            />
          )}
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder={t('reset_new_password')}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg input-focus outline-none text-slate-900 dark:text-white placeholder-slate-400 text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <input
            type="password"
            placeholder={t('reset_confirm_password')}
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg input-focus outline-none text-slate-900 dark:text-white placeholder-slate-400 text-sm"
          />
          <button
            type="submit"
            disabled={loading || !token}
            className="w-full btn-primary py-2.5 rounded-lg font-semibold text-sm disabled:opacity-50"
          >
            {loading ? '...' : t('reset_submit')}
          </button>
        </form>

        <Link to="/" className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 mt-5 justify-center">
          <ArrowLeft size={13} /> {t('reset_back')}
        </Link>
      </div>
    </div>
  );
}

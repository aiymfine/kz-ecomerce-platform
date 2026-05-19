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
      <div className="max-w-md mx-auto px-4 py-20 text-center animate-fade-in">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-green-500" />
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-3">{t('reset_success_title')}</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">{t('reset_success_desc')}</p>
        <Link to="/" className="btn-primary text-white px-6 py-3 rounded-xl font-semibold inline-block">
          {t('reset_go_login')}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16 animate-fade-in-up">
      <div className="bg-white dark:bg-[#14141F]/80 rounded-2xl p-8 border border-blue-100/60 dark:border-white/5 shadow-sm shadow-sm">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <KeyRound size={24} className="text-green-600" />
          </div>
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-white">{t('reset_title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{t('reset_desc')}</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!token && (
            <input
              type="text"
              placeholder={t('reset_token_placeholder')}
              value={token}
              onChange={e => setToken(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-blue-200 dark:border-white/10 rounded-xl input-premium outline-none text-gray-900 dark:text-white placeholder-gray-400 font-mono text-sm"
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
              className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-blue-200 dark:border-white/10 rounded-xl input-premium outline-none text-gray-900 dark:text-white placeholder-gray-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <input
            type="password"
            placeholder={t('reset_confirm_password')}
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-blue-200 dark:border-white/10 rounded-xl input-premium outline-none text-gray-900 dark:text-white placeholder-gray-400"
          />
          <button
            type="submit"
            disabled={loading || !token}
            className="w-full btn-primary text-white py-3 rounded-xl font-semibold disabled:opacity-50"
          >
            {loading ? '...' : t('reset_submit')}
          </button>
        </form>

        <Link to="/" className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mt-6 justify-center">
          <ArrowLeft size={14} /> {t('reset_back')}
        </Link>
      </div>
    </div>
  );
}

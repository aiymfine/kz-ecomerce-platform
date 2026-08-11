import { Link } from 'react-router-dom';
import { useCartContext } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { useDarkMode } from '../hooks/useDarkMode';
import { useLang } from '../hooks/useLang';
import { useState } from 'react';
import { ShoppingCart, Sun, Moon, Menu, X, Store, Globe } from 'lucide-react';

export function Header() {
  const { itemCount } = useCartContext();
  const { user, isAuthenticated, login, register, logout } = useAuth();
  const { dark, toggle } = useDarkMode();
  const { t, lang, setLang } = useLang();
  const [showAuth, setShowAuth] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await login(email, password);
      setShowAuth(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || t('auth_login_error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await register({ email, password, firstName, lastName, phone });
      setShowAuth(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || t('auth_register_error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Store size={16} className="text-white" />
            </div>
            <span className="font-bold text-base text-slate-900 dark:text-white">ShopBuilder</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            <Link to="/" className="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              {t('nav_home')}
            </Link>
            <Link to="/products" className="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              {t('nav_products')}
            </Link>
            <Link to="/merchant/dashboard" className="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              {t('nav_merchant')}
            </Link>
            {isAuthenticated && (
              <Link to="/profile" className="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                {t('nav_profile')}
              </Link>
            )}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setLang(lang === 'kk' ? 'en' : 'kk')}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Globe size={14} />
              <span>{lang === 'kk' ? 'RU' : 'EN'}</span>
            </button>

            <button
              onClick={toggle}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle dark mode"
            >
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <Link to="/cart" className="relative p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <ShoppingCart size={16} />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-indigo-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <div className="hidden sm:flex items-center gap-2 pl-2">
                <span className="text-sm text-slate-600 dark:text-slate-300">{user?.firstName}</span>
                <button onClick={logout} className="text-sm text-slate-400 hover:text-red-500 transition-colors">{t('nav_logout')}</button>
              </div>
            ) : (
              <button
                onClick={() => { setShowAuth(true); setMode('login'); setError(''); }}
                className="hidden sm:inline-flex btn-primary px-4 py-1.5 rounded-lg text-sm font-semibold"
              >
                {t('nav_login')}
              </button>
            )}

            <button
              onClick={() => setMobileMenu(!mobileMenu)}
              className="md:hidden p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {mobileMenu ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenu && (
          <div className="md:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 animate-fade-in-fast">
            <div className="px-4 py-3 space-y-1">
              <Link to="/" onClick={() => setMobileMenu(false)} className="block px-3 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium text-sm">{t('nav_home')}</Link>
              <Link to="/products" onClick={() => setMobileMenu(false)} className="block px-3 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium text-sm">{t('nav_products')}</Link>
              <Link to="/merchant/dashboard" onClick={() => setMobileMenu(false)} className="block px-3 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium text-sm">{t('nav_merchant')}</Link>
              <button
                onClick={() => { setLang(lang === 'kk' ? 'en' : 'kk'); }}
                className="w-full text-left px-3 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium text-sm flex items-center gap-2"
              >
                <Globe size={14} /> {lang === 'kk' ? 'Switch to English' : 'Switch to Russian'}
              </button>
              {!isAuthenticated && (
                <button
                  onClick={() => { setMobileMenu(false); setShowAuth(true); setMode('login'); setError(''); }}
                  className="w-full btn-primary py-2 rounded-lg font-semibold text-sm mt-2"
                >
                  {t('nav_login')}
                </button>
              )}
              {isAuthenticated && (
                <button onClick={() => { logout(); setMobileMenu(false); }} className="w-full text-left px-3 py-2 text-red-500 font-medium text-sm">
                  {t('nav_logout')} ({user?.firstName})
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Auth Modal */}
      {showAuth && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-fast" onClick={() => setShowAuth(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md animate-fade-in border border-slate-200 dark:border-slate-700" onClick={e => e.stopPropagation()}>
            <div className="flex gap-6 border-b border-slate-200 dark:border-slate-700 px-6">
              <button
                onClick={() => { setMode('login'); setError(''); }}
                className={`pb-3 pt-5 text-sm font-semibold transition-colors ${mode === 'login' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}
              >
                {t('auth_login')}
              </button>
              <button
                onClick={() => { setMode('register'); setError(''); }}
                className={`pb-3 pt-5 text-sm font-semibold transition-colors ${mode === 'register' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}
              >
                {t('auth_register')}
              </button>
            </div>

            {error && <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 px-4 py-2.5 mx-6 mt-4 rounded-lg text-sm">{error}</div>}

            <div className="p-6">
              {mode === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-3">
                  <input type="email" placeholder={t('auth_email_placeholder')} value={email} onChange={e => setEmail(e.target.value)} required
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg input-focus outline-none text-slate-900 dark:text-white placeholder-slate-400 text-sm" />
                  <input type="password" placeholder={t('auth_password_placeholder')} value={password} onChange={e => setPassword(e.target.value)} required
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg input-focus outline-none text-slate-900 dark:text-white placeholder-slate-400 text-sm" />
                  <button type="submit" disabled={submitting}
                    className="w-full btn-primary py-2.5 rounded-lg font-semibold text-sm disabled:opacity-50">
                    {submitting ? '...' : t('auth_login')}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder={t('auth_firstname_placeholder')} value={firstName} onChange={e => setFirstName(e.target.value)} required
                      className="px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg input-focus outline-none text-slate-900 dark:text-white placeholder-slate-400 text-sm" />
                    <input type="text" placeholder={t('auth_lastname_placeholder')} value={lastName} onChange={e => setLastName(e.target.value)}
                      className="px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg input-focus outline-none text-slate-900 dark:text-white placeholder-slate-400 text-sm" />
                  </div>
                  <input type="email" placeholder={t('auth_email_placeholder')} value={email} onChange={e => setEmail(e.target.value)} required
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg input-focus outline-none text-slate-900 dark:text-white placeholder-slate-400 text-sm" />
                  <input type="tel" placeholder={t('auth_phone_placeholder')} value={phone} onChange={e => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg input-focus outline-none text-slate-900 dark:text-white placeholder-slate-400 text-sm" />
                  <input type="password" placeholder={t('auth_password_placeholder')} value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg input-focus outline-none text-slate-900 dark:text-white placeholder-slate-400 text-sm" />
                  <button type="submit" disabled={submitting}
                    className="w-full btn-primary py-2.5 rounded-lg font-semibold text-sm disabled:opacity-50">
                    {submitting ? '...' : t('auth_register')}
                  </button>
                </form>
              )}

              <div className="flex justify-center gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Link to="/forgot-password" onClick={() => setShowAuth(false)} className="text-xs text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  {t('forgot_title')}
                </Link>
                <Link to="/verify-email" onClick={() => setShowAuth(false)} className="text-xs text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  {t('verify_title')}
                </Link>
              </div>
              <div className="flex justify-center gap-4 mt-2">
                <Link to="/admin" onClick={() => setShowAuth(false)} className="text-xs text-slate-400 hover:text-red-500 transition-colors">
                  {t('admin_dashboard')}
                </Link>
                <Link to="/merchant/login" onClick={() => setShowAuth(false)} className="text-xs text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  {t('merchant_login_title')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import { Link } from 'react-router-dom';
import { useCartContext } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { useDarkMode } from '../hooks/useDarkMode';
import { useLang } from '../hooks/useLang';
import { useState } from 'react';
import { ShoppingCart, Sun, Moon, Menu, X, Zap, Globe } from 'lucide-react';

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
      <header className="glass sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="relative w-9 h-9 bg-gradient-to-br from-kz-blue to-kz-blue-dark rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-kz-blue/30 transition-shadow duration-300">
              <Zap size={18} className="text-white" />
              <div className="absolute -inset-0.5 bg-gradient-to-br from-kz-blue to-kz-gold rounded-xl opacity-0 group-hover:opacity-30 blur transition-opacity duration-300" />
            </div>
            <div className="flex items-baseline">
              <span className="font-extrabold text-lg text-gray-900 dark:text-white">Shop</span>
              <span className="font-extrabold text-lg text-kz-blue">Builder</span>
              <span className="text-kz-gold font-bold text-xs ml-1 bg-kz-gold/10 px-1.5 py-0.5 rounded-md">KZ</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Link to="/" className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-kz-blue dark:hover:text-kz-blue rounded-xl hover:bg-kz-blue/5 transition-all font-medium text-sm">
              {t('nav_home')}
            </Link>
            <Link to="/products" className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-kz-blue dark:hover:text-kz-blue rounded-xl hover:bg-kz-blue/5 transition-all font-medium text-sm">
              {t('nav_products')}
            </Link>
            {isAuthenticated && (
              <Link to="/profile" className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-kz-blue dark:hover:text-kz-blue rounded-xl hover:bg-kz-blue/5 transition-all font-medium text-sm">
                {t('nav_profile')}
              </Link>
            )}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Language toggle */}
            <button
              onClick={() => setLang(lang === 'kk' ? 'en' : 'kk')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
            >
              <Globe size={15} />
              <span>{lang === 'kk' ? 'RU' : 'EN'}</span>
            </button>

            {/* Dark mode toggle */}
            <button
              onClick={toggle}
              className="p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
              aria-label="Toggle dark mode"
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Cart */}
            <Link to="/cart" className="relative p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-all group">
              <ShoppingCart size={18} className="group-hover:text-kz-blue transition-colors" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-gradient-to-r from-kz-blue to-kz-gold text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg animate-scale-in">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Auth */}
            {isAuthenticated ? (
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">👋 {user?.firstName}</span>
                <button onClick={logout} className="text-sm text-gray-400 hover:text-red-500 transition">{t('nav_logout')}</button>
              </div>
            ) : (
              <button
                onClick={() => { setShowAuth(true); setMode('login'); setError(''); }}
                className="hidden sm:block btn-primary text-white px-5 py-2 rounded-xl text-sm font-semibold"
              >
                {t('nav_login')}
              </button>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenu(!mobileMenu)}
              className="md:hidden p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
            >
              {mobileMenu ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenu && (
          <div className="md:hidden glass-card border-t border-gray-100 dark:border-white/5 animate-fade-in">
            <div className="px-4 py-4 space-y-2">
              <Link to="/" onClick={() => setMobileMenu(false)} className="block px-4 py-2.5 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-kz-blue/5 font-medium">{t('nav_home')}</Link>
              <Link to="/products" onClick={() => setMobileMenu(false)} className="block px-4 py-2.5 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-kz-blue/5 font-medium">{t('nav_products')}</Link>
              {/* Mobile lang toggle */}
              <button
                onClick={() => { setLang(lang === 'kk' ? 'en' : 'kk'); }}
                className="w-full text-left px-4 py-2.5 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-kz-blue/5 font-medium flex items-center gap-2"
              >
                <Globe size={15} /> {lang === 'kk' ? 'Русский → English' : 'English → Рус'}
              </button>
              {!isAuthenticated && (
                <button
                  onClick={() => { setMobileMenu(false); setShowAuth(true); setMode('login'); setError(''); }}
                  className="w-full btn-primary text-white py-2.5 rounded-xl font-semibold mt-2"
                >
                  {t('nav_login')}
                </button>
              )}
              {isAuthenticated && (
                <button onClick={() => { logout(); setMobileMenu(false); }} className="w-full text-left px-4 py-2.5 text-red-500 font-medium">
                  {t('nav_logout')} ({user?.firstName})
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Auth Modal */}
      {showAuth && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowAuth(false)}>
          <div className="bg-white dark:bg-[#14141F] rounded-2xl p-8 w-full max-w-md shadow-2xl animate-scale-in border border-gray-100 dark:border-white/5" onClick={e => e.stopPropagation()}>
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => { setMode('login'); setError(''); }}
                className={`pb-2 font-semibold transition-all ${mode === 'login' ? 'text-kz-blue border-b-2 border-kz-blue' : 'text-gray-400 dark:text-gray-500'}`}
              >
                {t('auth_login')}
              </button>
              <button
                onClick={() => { setMode('register'); setError(''); }}
                className={`pb-2 font-semibold transition-all ${mode === 'register' ? 'text-kz-blue border-b-2 border-kz-blue' : 'text-gray-400 dark:text-gray-500'}`}
              >
                {t('auth_register')}
              </button>
            </div>

            {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm mb-4 animate-scale-in">{error}</div>}

            {mode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <input type="email" placeholder={t('auth_email_placeholder')} value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-blue-200 dark:border-white/10 rounded-xl input-premium outline-none text-gray-900 dark:text-white placeholder-gray-400" />
                <input type="password" placeholder={t('auth_password_placeholder')} value={password} onChange={e => setPassword(e.target.value)} required
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-blue-200 dark:border-white/10 rounded-xl input-premium outline-none text-gray-900 dark:text-white placeholder-gray-400" />
                <button type="submit" disabled={submitting}
                  className="w-full btn-primary text-white py-3 rounded-xl font-semibold disabled:opacity-50">
                  {submitting ? '...' : t('auth_login')}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder={t('auth_firstname_placeholder')} value={firstName} onChange={e => setFirstName(e.target.value)} required
                    className="px-4 py-3 bg-gray-50 dark:bg-white/5 border border-blue-200 dark:border-white/10 rounded-xl input-premium outline-none text-gray-900 dark:text-white placeholder-gray-400" />
                  <input type="text" placeholder={t('auth_lastname_placeholder')} value={lastName} onChange={e => setLastName(e.target.value)}
                    className="px-4 py-3 bg-gray-50 dark:bg-white/5 border border-blue-200 dark:border-white/10 rounded-xl input-premium outline-none text-gray-900 dark:text-white placeholder-gray-400" />
                </div>
                <input type="email" placeholder={t('auth_email_placeholder')} value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-blue-200 dark:border-white/10 rounded-xl input-premium outline-none text-gray-900 dark:text-white placeholder-gray-400" />
                <input type="tel" placeholder={t('auth_phone_placeholder')} value={phone} onChange={e => setPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-blue-200 dark:border-white/10 rounded-xl input-premium outline-none text-gray-900 dark:text-white placeholder-gray-400" />
                <input type="password" placeholder={t('auth_password_placeholder')} value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-blue-200 dark:border-white/10 rounded-xl input-premium outline-none text-gray-900 dark:text-white placeholder-gray-400" />
                <button type="submit" disabled={submitting}
                  className="w-full btn-primary text-white py-3 rounded-xl font-semibold disabled:opacity-50">
                  {submitting ? '...' : t('auth_register')}
                </button>
              </form>
            )}

            <p className="text-xs text-gray-400 dark:text-gray-500 mt-4 text-center">
              {t('auth_demo')}
            </p>
            <div className="flex justify-center gap-4 mt-3">
              <Link to="/forgot-password" onClick={() => setShowAuth(false)} className="text-xs text-gray-400 hover:text-kz-blue transition">
                {t('forgot_title')}
              </Link>
              <Link to="/verify-email" onClick={() => setShowAuth(false)} className="text-xs text-gray-400 hover:text-kz-blue transition">
                {t('verify_title')}
              </Link>
            </div>
            <Link to="/admin" onClick={() => setShowAuth(false)} className="block text-center text-xs text-red-400 hover:text-red-500 mt-2 transition">
              {t('admin_dashboard')} →
            </Link>
          </div>
        </div>
      )}
    </>
  );
}

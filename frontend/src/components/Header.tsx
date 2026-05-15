import { Link } from 'react-router-dom';
import { useCartContext } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { useDarkMode } from '../hooks/useDarkMode';
import { useState } from 'react';
import { ShoppingCart, Sun, Moon, Menu, X, Zap } from 'lucide-react';

export function Header() {
  const { itemCount } = useCartContext();
  const { user, isAuthenticated, login, register, logout } = useAuth();
  const { dark, toggle } = useDarkMode();
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
      setError(err?.response?.data?.message || 'Ошибка входа');
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
      setError(err?.response?.data?.message || 'Ошибка регистрации');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <header className="glass sticky top-0 z-50 border-b border-white/20 dark:border-white/5 transition-all duration-300">
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
            <Link to="/" className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-kz-blue dark:hover:text-kz-blue rounded-lg hover:bg-kz-blue/5 transition-all font-medium text-sm">
              Басты
            </Link>
            <Link to="/products" className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-kz-blue dark:hover:text-kz-blue rounded-lg hover:bg-kz-blue/5 transition-all font-medium text-sm">
              Өнімдер
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
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
                <button onClick={logout} className="text-sm text-gray-400 hover:text-red-500 transition">Шығу</button>
              </div>
            ) : (
              <button
                onClick={() => { setShowAuth(true); setMode('login'); setError(''); }}
                className="hidden sm:block bg-gradient-to-r from-kz-blue to-kz-blue-dark text-white px-5 py-2 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-kz-blue/25 transition-all duration-300 hover:-translate-y-0.5"
              >
                Кіру
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
          <div className="md:hidden glass-card border-t border-white/10 animate-fade-in">
            <div className="px-4 py-4 space-y-2">
              <Link to="/" onClick={() => setMobileMenu(false)} className="block px-4 py-2.5 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-kz-blue/5 font-medium">Басты</Link>
              <Link to="/products" onClick={() => setMobileMenu(false)} className="block px-4 py-2.5 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-kz-blue/5 font-medium">Өнімдер</Link>
              {!isAuthenticated && (
                <button
                  onClick={() => { setMobileMenu(false); setShowAuth(true); setMode('login'); setError(''); }}
                  className="w-full bg-gradient-to-r from-kz-blue to-kz-blue-dark text-white py-2.5 rounded-xl font-semibold mt-2"
                >
                  Кіру
                </button>
              )}
              {isAuthenticated && (
                <button onClick={() => { logout(); setMobileMenu(false); }} className="w-full text-left px-4 py-2.5 text-red-500 font-medium">
                  Шығу ({user?.firstName})
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Auth Modal */}
      {showAuth && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowAuth(false)}>
          <div className="glass-card rounded-2xl p-8 w-full max-w-md shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => { setMode('login'); setError(''); }}
                className={`pb-2 font-semibold transition-all ${mode === 'login' ? 'text-kz-blue border-b-2 border-kz-blue' : 'text-gray-400 dark:text-gray-500'}`}
              >
                Кіру
              </button>
              <button
                onClick={() => { setMode('register'); setError(''); }}
                className={`pb-2 font-semibold transition-all ${mode === 'register' ? 'text-kz-blue border-b-2 border-kz-blue' : 'text-gray-400 dark:text-gray-500'}`}
              >
                Тіркелу
              </button>
            </div>

            {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm mb-4 animate-scale-in">{error}</div>}

            {mode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-kz-blue/50 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400" />
                <input type="password" placeholder="Құпия сөз" value={password} onChange={e => setPassword(e.target.value)} required
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-kz-blue/50 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400" />
                <button type="submit" disabled={submitting}
                  className="w-full bg-gradient-to-r from-kz-blue to-kz-blue-dark text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-kz-blue/25 transition-all disabled:opacity-50">
                  {submitting ? '...' : 'Кіру'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="Аты" value={firstName} onChange={e => setFirstName(e.target.value)} required
                    className="px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-kz-blue/50 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400" />
                  <input type="text" placeholder="Тегі" value={lastName} onChange={e => setLastName(e.target.value)}
                    className="px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-kz-blue/50 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400" />
                </div>
                <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-kz-blue/50 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400" />
                <input type="tel" placeholder="Телефон: +7 777 000 0000" value={phone} onChange={e => setPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-kz-blue/50 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400" />
                <input type="password" placeholder="Құпия сөз" value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-kz-blue/50 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400" />
                <button type="submit" disabled={submitting}
                  className="w-full bg-gradient-to-r from-kz-blue to-kz-blue-dark text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-kz-blue/25 transition-all disabled:opacity-50">
                  {submitting ? '...' : 'Тіркелу'}
                </button>
              </form>
            )}

            <p className="text-xs text-gray-400 dark:text-gray-500 mt-4 text-center">
              Demo: test@customer.kz / Customer123
            </p>
          </div>
        </div>
      )}
    </>
  );
}

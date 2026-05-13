import { Link } from 'react-router-dom';
import { useCartContext } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { useState } from 'react';

export function Header() {
  const { itemCount } = useCartContext();
  const { user, isAuthenticated, login, register, logout } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
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
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="font-bold text-xl text-gray-900">TechShop <span className="text-blue-600">KZ</span></span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-gray-600 hover:text-blue-600 transition font-medium">Басты</Link>
            <Link to="/products" className="text-gray-600 hover:text-blue-600 transition font-medium">Өнімдер</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/cart" className="relative p-2 text-gray-600 hover:text-blue-600 transition">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {itemCount}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 hidden sm:block">👋 {user?.firstName}</span>
                <button onClick={logout} className="text-sm text-gray-400 hover:text-red-500 transition">Шығу</button>
              </div>
            ) : (
              <button
                onClick={() => { setShowAuth(true); setMode('login'); setError(''); }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
              >
                Кіру
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      {showAuth && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAuth(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => { setMode('login'); setError(''); }}
                className={`pb-2 font-medium ${mode === 'login' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}
              >
                Кіру
              </button>
              <button
                onClick={() => { setMode('register'); setError(''); }}
                className={`pb-2 font-medium ${mode === 'register' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}
              >
                Тіркелу
              </button>
            </div>

            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">{error}</div>}

            {mode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                <input type="password" placeholder="Құпия сөз" value={password} onChange={e => setPassword(e.target.value)} required className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                <button type="submit" disabled={submitting} className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50">
                  {submitting ? '...' : 'Кіру'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="Аты" value={firstName} onChange={e => setFirstName(e.target.value)} required className="px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  <input type="text" placeholder="Тегі" value={lastName} onChange={e => setLastName(e.target.value)} className="px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                <input type="tel" placeholder="Телефон: +7 777 000 0000" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                <input type="password" placeholder="Құпия сөз" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                <button type="submit" disabled={submitting} className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50">
                  {submitting ? '...' : 'Тіркелу'}
                </button>
              </form>
            )}

            <p className="text-xs text-gray-400 mt-4 text-center">
              Demo: test@customer.kz / Customer123
            </p>
          </div>
        </div>
      )}
    </>
  );
}

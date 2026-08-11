import { Header } from './Header';
import { Footer } from './Footer';
import { ToastContainer } from './Toast';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, ShoppingCart, User } from 'lucide-react';
import { useCartContext } from '../hooks/useCart';
import { useLang } from '../hooks/useLang';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <ToastContainer />
      <MobileBottomNav />
    </div>
  );
}

function MobileBottomNav() {
  const location = useLocation();
  const { itemCount } = useCartContext();
  const { t } = useLang();

  const links = [
    { to: '/', icon: Home, label: t('nav_home') },
    { to: '/products', icon: Search, label: t('nav_search') },
    { to: '/cart', icon: ShoppingCart, label: t('nav_cart'), badge: itemCount },
    { to: '/profile', icon: User, label: t('nav_profile') },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
      <div className="flex justify-around items-center h-14 px-2">
        {links.map(link => {
          const active = location.pathname === link.to;
          const Icon = link.icon;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
                active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              <div className="relative">
                <Icon size={20} strokeWidth={active ? 2 : 1.5} />
                {link.badge && link.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-indigo-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {link.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

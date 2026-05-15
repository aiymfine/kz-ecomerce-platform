import { Header } from './Header';
import { Footer } from './Footer';
import { ToastContainer } from './Toast';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-[#0a0a0f] transition-colors duration-300">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <ToastContainer />
      {/* Mobile bottom nav */}
      <MobileBottomNav />
    </div>
  );
}

import { Link, useLocation } from 'react-router-dom';
import { Home, Search, ShoppingCart, User } from 'lucide-react';
import { useCartContext } from '../hooks/useCart';

function MobileBottomNav() {
  const location = useLocation();
  const { itemCount } = useCartContext();

  const links = [
    { to: '/', icon: Home, label: 'Басты' },
    { to: '/products', icon: Search, label: 'Іздеу' },
    { to: '/cart', icon: ShoppingCart, label: 'Себет', badge: itemCount },
    { to: '#profile', icon: User, label: 'Профиль' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass dark:glass border-t border-gray-200/50 dark:border-white/5">
      <div className="flex justify-around items-center h-16 px-2">
        {links.map(link => {
          const active = location.pathname === link.to;
          const Icon = link.icon;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-all ${
                active ? 'text-kz-blue' : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              <div className="relative">
                <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
                {link.badge && link.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-kz-gold text-[10px] text-gray-900 font-bold rounded-full w-4 h-4 flex items-center justify-center">
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

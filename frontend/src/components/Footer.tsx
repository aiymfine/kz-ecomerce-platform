import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Heart, Globe, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { useLang } from '../hooks/useLang';

export function Footer() {
  const { t } = useLang();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <footer className="bg-gray-900 dark:bg-[#050510] text-gray-400 mt-auto border-t border-white/5">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-gradient-to-br from-kz-blue to-kz-blue-dark rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-sm">SB</span>
              </div>
              <div>
                <span className="font-extrabold text-white">Shop</span>
                <span className="font-extrabold text-kz-blue-light">Builder</span>
                <span className="text-kz-gold font-bold text-xs ml-1">KZ</span>
              </div>
            </Link>
            <p className="text-sm leading-relaxed">{t('footer_brand_desc')}</p>
            {/* Social icons */}
            <div className="flex gap-3 mt-5">
              <a href="#" className="w-9 h-9 rounded-lg bg-white/5 hover:bg-kz-blue/20 flex items-center justify-center transition-all hover:text-kz-blue-light text-sm">
                📸
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-white/5 hover:bg-kz-blue/20 flex items-center justify-center transition-all hover:text-kz-blue-light">
                <MessageCircle size={16} />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-white/5 hover:bg-kz-blue/20 flex items-center justify-center transition-all hover:text-kz-blue-light">
                <Globe size={16} />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">{t('footer_services')}</h4>
            <ul className="space-y-2.5 text-sm">
              <li className="hover:text-kz-blue-light transition cursor-pointer">{t('footer_kaspi')}</li>
              <li className="hover:text-kz-blue-light transition cursor-pointer">{t('footer_halyk')}</li>
              <li className="hover:text-kz-blue-light transition cursor-pointer">{t('footer_insurance')}</li>
              <li className="hover:text-kz-blue-light transition cursor-pointer">{t('footer_free_delivery')}</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">{t('footer_contact')}</h4>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center gap-2"><Mail size={14} /> support@techshop.kz</li>
              <li className="flex items-center gap-2"><Phone size={14} /> +7 (727) 000-00-00</li>
              <li className="flex items-center gap-2"><MapPin size={14} /> Almaty, Kazakhstan</li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-white font-semibold mb-4">{t('footer_newsletter')}</h4>
            <p className="text-sm mb-3">{t('footer_newsletter_desc')}</p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm outline-none focus:border-kz-blue/50 transition placeholder-gray-500 text-white"
              />
              <button type="submit" className="px-4 py-2 bg-gradient-to-r from-kz-blue to-kz-blue-dark text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all">
                {subscribed ? '✓' : '→'}
              </button>
            </form>
            {subscribed && <p className="text-xs text-green-400 mt-2 animate-fade-in">{t('footer_subscribed')}</p>}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-sm text-gray-500">
            {t('footer_copyright')} <Heart size={12} className="inline text-red-500" /> {t('footer_in_kazakhstan')}
          </p>
          <div className="flex gap-4 text-sm text-gray-500">
            <span className="hover:text-gray-300 transition cursor-pointer">{t('footer_terms')}</span>
            <span className="hover:text-gray-300 transition cursor-pointer">{t('footer_privacy')}</span>
          </div>
        </div>
      </div>

      {/* Mobile bottom spacer */}
      <div className="h-16 md:hidden" />
    </footer>
  );
}

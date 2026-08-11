import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Globe } from 'lucide-react';
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
    <footer className="bg-slate-900 text-slate-400 mt-auto border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">SB</span>
              </div>
              <span className="font-bold text-white text-sm">ShopBuilder KZ</span>
            </Link>
            <p className="text-sm leading-relaxed">{t('footer_brand_desc')}</p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">{t('footer_services')}</h4>
            <ul className="space-y-2 text-sm">
              <li className="hover:text-indigo-400 transition-colors cursor-pointer">{t('footer_kaspi')}</li>
              <li className="hover:text-indigo-400 transition-colors cursor-pointer">{t('footer_halyk')}</li>
              <li className="hover:text-indigo-400 transition-colors cursor-pointer">{t('footer_insurance')}</li>
              <li className="hover:text-indigo-400 transition-colors cursor-pointer">{t('footer_free_delivery')}</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">{t('footer_contact')}</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2"><Mail size={14} /> support@shopbuilder.kz</li>
              <li className="flex items-center gap-2"><Phone size={14} /> +7 (727) 000-00-00</li>
              <li className="flex items-center gap-2"><MapPin size={14} /> Almaty, Kazakhstan</li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">{t('footer_newsletter')}</h4>
            <p className="text-sm mb-3">{t('footer_newsletter_desc')}</p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm outline-none focus:border-indigo-500 transition-colors placeholder-slate-500 text-white"
              />
              <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors">
                {subscribed ? '✓' : '→'}
              </button>
            </form>
            {subscribed && <p className="text-xs text-green-400 mt-2 animate-fade-in-fast">{t('footer_subscribed')}</p>}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-sm text-slate-500">
            {t('footer_copyright')} {t('footer_in_kazakhstan')}
          </p>
          <div className="flex gap-4 text-sm text-slate-500">
            <span className="hover:text-slate-300 transition-colors cursor-pointer">{t('footer_terms')}</span>
            <span className="hover:text-slate-300 transition-colors cursor-pointer">{t('footer_privacy')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

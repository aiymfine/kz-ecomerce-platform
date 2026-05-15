import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { kk } from '../lang/kk';
import { en } from '../lang/en';

type Lang = 'kk' | 'en';
const translations: Record<Lang, Record<string, string>> = { kk, en };

const LangContext = createContext<{
  t: (key: string) => string;
  lang: Lang;
  setLang: (l: Lang) => void;
} | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      const saved = localStorage.getItem('lang');
      return saved === 'en' ? 'en' : 'kk';
    } catch { return 'kk'; }
  });

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem('lang', l);
  }, []);

  const t = useCallback((key: string) => {
    return translations[lang][key] ?? key;
  }, [lang]);

  return (
    <LangContext.Provider value={{ t, lang, setLang }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be inside LangProvider');
  return ctx;
}

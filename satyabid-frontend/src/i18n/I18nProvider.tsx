import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Lang } from '../types';
import { translations } from './translations';
import { LANGUAGES } from './languages';

interface I18nContextShape {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextShape | null>(null);

const RTL_LANGS = new Set(LANGUAGES.filter((l) => l.rtl).map((l) => l.code));

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem('satyabid_lang') as Lang) || 'en');

  const setLangPersist = (l: Lang) => {
    setLang(l);
    localStorage.setItem('satyabid_lang', l);
  };

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = RTL_LANGS.has(lang) ? 'rtl' : 'ltr';
  }, [lang]);

  const t = (key: string) => translations[lang]?.[key] ?? translations.en[key] ?? key;

  const value = useMemo(() => ({ lang, setLang: setLangPersist, t }), [lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

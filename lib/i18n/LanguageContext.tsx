'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Locale, TranslationDictionary, SUPPORTED_LANGUAGES, LanguageOption } from './types';
import { translations, en } from './translations';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, fallback?: string) => string;
  dictionary: TranslationDictionary;
  supportedLanguages: LanguageOption[];
}

const LanguageContext = createContext<LanguageContextType>({
  locale: 'en',
  setLocale: () => {},
  t: (key: string, fallback?: string) => fallback || key,
  dictionary: en,
  supportedLanguages: SUPPORTED_LANGUAGES,
});

export function LanguageProvider({
  children,
  initialLocale = 'en',
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    // Check saved preference from localStorage
    const saved = localStorage.getItem('preferred_locale') as Locale | null;
    if (saved && (saved === 'en' || saved === 'fr' || saved === 'es' || saved === 'pt')) {
      setLocaleState(saved);
      return;
    }

    // Check cookie
    const match = document.cookie.match(/(?:^|; )NEXT_LOCALE=([^;]*)/);
    const cookieLocale = match ? (decodeURIComponent(match[1]) as Locale) : null;
    if (cookieLocale && (cookieLocale === 'en' || cookieLocale === 'fr' || cookieLocale === 'es' || cookieLocale === 'pt')) {
      setLocaleState(cookieLocale);
      return;
    }

    // Check navigator.language
    if (typeof navigator !== 'undefined' && navigator.language) {
      const browserLang = navigator.language.slice(0, 2).toLowerCase();
      if (browserLang === 'fr') setLocaleState('fr');
      else if (browserLang === 'es') setLocaleState('es');
      else if (browserLang === 'pt') setLocaleState('pt');
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem('preferred_locale', newLocale);
      document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // Ignored in restricted iframe/private mode
    }
  };

  const dictionary = translations[locale] || en;

  const t = (key: string, fallback?: string): string => {
    const parts = key.split('.');
    let current: any = dictionary;

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        current = null;
        break;
      }
    }

    if (typeof current === 'string') {
      return current;
    }

    // Fallback to English
    let enCurrent: any = en;
    for (const part of parts) {
      if (enCurrent && typeof enCurrent === 'object' && part in enCurrent) {
        enCurrent = enCurrent[part];
      } else {
        enCurrent = null;
        break;
      }
    }

    if (typeof enCurrent === 'string') {
      return enCurrent;
    }

    return fallback || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        locale,
        setLocale,
        t,
        dictionary,
        supportedLanguages: SUPPORTED_LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  return useContext(LanguageContext);
}

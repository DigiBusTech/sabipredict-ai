'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Globe } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { Locale } from '@/lib/i18n/types';

export default function LanguageSwitcher({
  className = '',
  dropUp = false,
}: {
  className?: string;
  dropUp?: boolean;
}) {
  const { locale, setLocale, supportedLanguages } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentLang =
    supportedLanguages.find((l) => l.code === locale) || supportedLanguages[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (code: Locale) => {
    setLocale(code);
    setIsOpen(false);
  };

  const dropdownPos = dropUp ? 'bottom-full mb-2' : 'top-full mt-2';

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Select Language"
        className="flex items-center gap-1.5 rounded-lg border border-[#3A506B]/60 bg-[#1C2541]/80 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:border-[#48CAE4] hover:bg-[#1C2541] hover:text-white transition-all shadow-sm focus:outline-none"
      >
        <span className="text-sm leading-none" role="img" aria-label={currentLang.label}>
          {currentLang.flag}
        </span>
        <span className="font-bold tracking-wider text-[11px] uppercase text-white">
          {currentLang.code}
        </span>
        <ChevronDown
          className={`h-3 w-3 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#48CAE4]' : ''}`}
        />
      </button>

      {isOpen && (
        <div className={`absolute ${dropdownPos} right-0 z-50 w-36 rounded-xl border border-[#223156] bg-[#0B132B]/98 p-1 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150`}>
          <div className="space-y-0.5">
            {supportedLanguages.map((lang) => {
              const isSelected = lang.code === locale;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSelect(lang.code)}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    isSelected
                      ? 'bg-[#1C2541] text-[#48CAE4] font-bold'
                      : 'text-slate-300 hover:bg-[#1C2541]/60 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-sm leading-none" role="img" aria-label={lang.label}>
                      {lang.flag}
                    </span>
                    <span>{lang.label}</span>
                  </span>
                  {isSelected && <Check className="h-3.5 w-3.5 text-[#48CAE4]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React from 'react';
import Image from 'next/image';
import { Zap, Target, Cpu, Trophy } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { HomepageContent } from '@/lib/types';

export default function HeroSection({ content }: { content: HomepageContent }) {
  const { t, locale } = useTranslation();
  const localized = content.translations[locale] || content.translations.en || {};

  return (
    <section className="relative isolate overflow-hidden border-b border-[#1C2541] bg-[#0B132B] py-12 sm:py-16">
      {content.hero_image_url && <Image src={content.hero_image_url} alt={content.hero_image_alt[locale] || content.hero_image_alt.en || ''} fill priority sizes="100vw" className="-z-20 object-cover" />}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-r from-[#0B132B]/95 via-[#0B132B]/75 to-[#0B132B]/35" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#3A506B] bg-[#1C2541] px-3.5 py-1 text-xs font-semibold text-[#48CAE4]">
            <Zap className="h-3.5 w-3.5" />
            <span>{localized.eyebrow || t('hero.topBadge', 'AI-Powered Football Insights')}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            {localized.headline || t('hero.headline', 'Win More with')}{' '}
            <span className="bg-linear-to-r from-[#48CAE4] to-[#0077B6] bg-clip-text text-transparent">
              {localized.headline_highlight || t('hero.headlineHighlight', 'AI-Driven Football Predictions')}
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl mx-auto">
            {localized.description || t(
              'hero.subheadline',
              'We analyze thousands of data points, live stats, and team form to give you highly accurate, low-risk football betting tips every single day.'
            )}
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-xs font-medium text-slate-300">
            <span className="flex items-center gap-1.5 rounded-xl bg-[#0B132B] px-3 py-1.5 border border-[#223156]">
              <Target className="h-3.5 w-3.5 text-[#48CAE4]" />
              <span>{localized.accuracy_label || t('hero.accuracyBadge', '78%+ Historical Accuracy')}</span>
            </span>
            <span className="flex items-center gap-1.5 rounded-xl bg-[#0B132B] px-3 py-1.5 border border-[#223156]">
              <Cpu className="h-3.5 w-3.5 text-[#48CAE4]" />
              <span>{localized.verified_label || t('hero.verifiedDataBadge', 'AI-Verified Data')}</span>
            </span>
            <span className="flex items-center gap-1.5 rounded-xl bg-[#0B132B] px-3 py-1.5 border border-[#223156]">
              <Trophy className="h-3.5 w-3.5 text-amber-400" />
              <span>{localized.banker_label || t('hero.bankerBadge', 'Banker of the Day')}</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

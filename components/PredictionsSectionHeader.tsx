'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function PredictionsSectionHeader() {
  const { t } = useTranslation();

  return (
    <div className="mb-4 flex items-center justify-between">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-white">
          {t('predictions.header', "Today's Top Football Tips")}
        </h2>
        <p className="text-xs text-slate-400">
          {t(
            'predictions.subtext',
            "Check yesterday's winning results, grab today's live predictions, or plan ahead with tomorrow's early tips."
          )}
        </p>
      </div>
      <Link
        href="/vip"
        className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
      >
        <span>{t('predictions.vipLoungeLink', 'VIP Lounge')}</span>
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

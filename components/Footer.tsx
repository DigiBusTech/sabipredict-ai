'use client';

import React from 'react';
import Link from 'next/link';
import { Activity, ShieldAlert, Cpu } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-[#1C2541] bg-[#0B132B] text-slate-400">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-linear-to-tr from-[#3A506B] to-[#48CAE4] text-[#0B132B]">
                <Activity className="h-4 w-4 stroke-[2.5]" />
              </div>
              <span className="text-base font-black text-white">
                SabiPredict <span className="text-[#48CAE4]">AI</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed">
              {t(
                'footer.aboutText',
                'Your trusted AI sports prediction platform. SabiPredict analyzes live match data, team form, and historical stats to provide the most accurate and reliable football tips.'
              )}
            </p>
            <div className="flex items-center gap-2 text-[11px] text-[#48CAE4] font-mono">
              <Cpu className="h-3.5 w-3.5" />
              <span>{t('footer.apiBadgeText', 'Live Match Data Integration Active')}</span>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-white tracking-wider uppercase mb-3">
              {t('footer.platform', 'Platform')}
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/predictions" className="hover:text-[#48CAE4] transition-colors">
                  {t('footer.dailyPredictions', 'Daily Predictions')}
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-[#48CAE4] transition-colors">
                  {t('footer.vipMemberships', 'VIP Memberships')}
                </Link>
              </li>
              <li>
                <Link href="/vip" className="hover:text-[#48CAE4] transition-colors">
                  {t('footer.vipLounge', 'VIP Lounge')}
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-[#48CAE4] transition-colors">
                  {t('footer.quantBlog', 'Quant Betting Blog')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold text-white tracking-wider uppercase mb-3">
              {t('footer.disclaimerTitle', 'Disclaimer')}
            </h3>
            <div className="flex items-start gap-2 text-[11px] text-slate-500 leading-relaxed">
              <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <span>
                {t(
                  'footer.disclaimerText',
                  'SabiPredict AI is a sports statistical research platform. Gambling carries financial risk. Please gamble responsibly. 18+ only.'
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[#1C2541] flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-4">
          <p>
            © {new Date().getFullYear()} SabiPredict AI. {t('footer.allRightsReserved', 'All rights reserved.')}
          </p>
          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <Link href="/pricing" className="hover:text-slate-400 transition-colors">
              {t('footer.termsLink', 'Terms & VIP Access')}
            </Link>
            <span>•</span>
            <Link href="/blog" className="hover:text-slate-400 transition-colors">
              {t('footer.responsibleLink', 'Responsible Analytics')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}



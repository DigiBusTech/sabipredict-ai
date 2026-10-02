import React from 'react';
import Link from 'next/link';
import { Crown, Sparkles, CheckCircle2, Shield, Zap, Lock } from 'lucide-react';
import { getCurrentUserProfile } from '@/lib/db';
import { hasActiveVipMembership } from '@/lib/growth';
import VipPredictionsFeed from '@/components/VipPredictionsFeed';
import { getRequestLocale } from '@/lib/i18n/server';
import { getPageMetadata } from '@/lib/site-content';
import { translations } from '@/lib/i18n/translations';

export async function generateMetadata() {
  return getPageMetadata('/vip', await getRequestLocale(), {
    title: 'VIP Lounge | SabiPredict AI',
    description: 'VIP football predictions and match analytics.',
  });
}

export default async function VipLoungePage() {
  const [profile, locale] = await Promise.all([getCurrentUserProfile(), getRequestLocale()]);
  const copy = translations[locale].vip;

  const isVip = profile?.role === 'admin' || (profile ? hasActiveVipMembership(profile) : false);

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateString = (date: Date) => date.toISOString().slice(0, 10);
  const todayStr = dateString(today);
  const yesterdayStr = dateString(yesterday);
  const tomorrowStr = dateString(tomorrow);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* VIP Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/40 bg-linear-to-r from-amber-950/40 via-[#111C38] to-amber-950/30 p-6 sm:p-10 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-300">
            <Crown className="h-3.5 w-3.5" />
            <span>{copy.badge}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            {copy.title}
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {copy.description}
          </p>

          <div className="pt-2 flex flex-wrap gap-4 text-xs font-semibold text-amber-300">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-amber-400" /> {copy.historical}
            </span>
            <span className="flex items-center gap-1">
              <Shield className="h-4 w-4 text-amber-400" /> {copy.bankroll}
            </span>
            <span className="flex items-center gap-1">
              <Zap className="h-4 w-4 text-amber-400" /> {copy.liveFeed}
            </span>
          </div>
        </div>
      </div>

      {!isVip && (
        <div className="rounded-2xl border border-amber-500/40 bg-[#111C38] p-6 text-center shadow-xl space-y-3">
          <Lock className="h-6 w-6 text-amber-400 mx-auto" />
          <h3 className="text-base font-black text-white">{copy.restricted}</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">{copy.restrictedDescription}</p>
          <div>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-amber-500 to-yellow-500 px-5 py-2 text-xs font-extrabold text-[#0B132B] shadow-lg hover:brightness-110 active:scale-95"
            >
              <Sparkles className="h-4 w-4" /> {copy.viewPlans}
            </Link>
          </div>
        </div>
      )}

      <VipPredictionsFeed
        initialDate={todayStr}
        yesterdayStr={yesterdayStr}
        todayStr={todayStr}
        tomorrowStr={tomorrowStr}
        isVipMember={isVip}
      />
    </div>
  );
}

import React from 'react';
import Link from 'next/link';
import { Crown, Sparkles, CheckCircle2, Shield, Zap, Trophy, Lock } from 'lucide-react';
import { getPredictions, getCurrentUserProfile } from '@/lib/db';
import PredictionCard from '@/components/PredictionCard';

export const metadata = {
  title: 'VIP Lounge & Banker of the Day | SabiPredict AI',
  description: 'Exclusive algorithmic value bets with 80%+ Poisson confidence scores and high Expected Value (+EV).',
};

export default async function VipLoungePage() {
  const [allTips, profile] = await Promise.all([
    getPredictions({ status: 'approved', tier: 'vip' }),
    getCurrentUserProfile(),
  ]);

  const isVip = profile?.role === 'vip_user' || profile?.role === 'admin';
  const banker = allTips.length > 0 ? allTips[0] : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* VIP Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/40 bg-linear-to-r from-amber-950/40 via-[#111C38] to-amber-950/30 p-6 sm:p-10 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-300">
            <Crown className="h-3.5 w-3.5" />
            <span>VIP LOUNGE ELITE CLUB</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            The Algorithmic <span className="text-amber-400">VIP Lounge</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            High-confidence winning picks. Filtered strictly for low-risk selections with model confidence above 80%.
          </p>

          <div className="pt-2 flex flex-wrap gap-4 text-xs font-semibold text-amber-300">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-amber-400" /> 84.6% Historical Win Rate
            </span>
            <span className="flex items-center gap-1">
              <Shield className="h-4 w-4 text-amber-400" /> Safe Bankroll Sizing
            </span>
            <span className="flex items-center gap-1">
              <Zap className="h-4 w-4 text-amber-400" /> Live Match Feed Active
            </span>
          </div>
        </div>
      </div>

      {!isVip && (
        <div className="rounded-2xl border border-amber-500/40 bg-[#111C38] p-6 text-center shadow-xl space-y-3">
          <Lock className="h-6 w-6 text-amber-400 mx-auto" />
          <h3 className="text-base font-black text-white">VIP Lounge Access Restricted</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            You are currently on the Free tier. Upgrade your membership to view the Banker of the Day, detailed xG breakdowns, and high-odds combinations.
          </p>
          <div>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-amber-500 to-yellow-500 px-5 py-2 text-xs font-extrabold text-[#0B132B] shadow-lg hover:brightness-110 active:scale-95"
            >
              <Sparkles className="h-4 w-4" /> View VIP Plans & Pricing
            </Link>
          </div>
        </div>
      )}

      {/* Banker of the Day */}
      {banker && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="h-5 w-5 text-amber-400" />
            <h2 className="text-base font-black text-white">Banker of the Day</h2>
            <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30">
              Highest Algorithmic Edge
            </span>
          </div>
          <div className="max-w-2xl">
            <PredictionCard prediction={banker} isVipMember={isVip} />
          </div>
        </div>
      )}

      {/* All VIP Selections Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-black text-white">All Active VIP Selections</h2>
            <p className="text-xs text-slate-400">Real-time database predictions flagged for VIP edge.</p>
          </div>
          <span className="text-xs font-bold text-[#48CAE4]">
            {allTips.length} Tips Available
          </span>
        </div>

        {allTips.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#1C2541] bg-[#111C38]/40 p-8 text-center text-xs text-slate-400">
            No active VIP predictions staged yet. Check back soon or visit the Admin dashboard to approve new tips.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allTips.map((tip) => (
              <PredictionCard key={tip.id} prediction={tip} isVipMember={isVip} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

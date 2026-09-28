import React from 'react';
import Link from 'next/link';
import { Trophy, Cpu, ArrowRight, Zap, Target } from 'lucide-react';
import PredictionsFeed from '@/components/PredictionsFeed';
import { getCurrentUserProfile } from '@/lib/db';

export default async function HomePage() {
  const profile = await getCurrentUserProfile();

  const now = new Date();
  const yest = new Date(now);
  yest.setDate(yest.getDate() - 1);
  const tom = new Date(now);
  tom.setDate(tom.getDate() + 1);

  const yesterdayStr = yest.toISOString().split('T')[0];
  const todayStr = now.toISOString().split('T')[0];
  const tomorrowStr = tom.toISOString().split('T')[0];

  return (
    <div className="space-y-10 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-[#1C2541] bg-linear-to-b from-[#0B132B] via-[#111C38] to-[#0B132B] py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#3A506B] bg-[#1C2541] px-3.5 py-1 text-xs font-semibold text-[#48CAE4]">
              <Zap className="h-3.5 w-3.5" />
              <span>Sportsmonks v3 Telemetry & Quantitative Poisson Intelligence</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
              Algorithmic Football Predictions with{' '}
              <span className="bg-linear-to-r from-[#48CAE4] to-[#0077B6] bg-clip-text text-transparent">
                Mathematical Edge
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl mx-auto">
              SabiPredict AI calculates Expected Goals (xG), Poisson goal probability matrices, and positive Expected Value (+EV) sports predictions.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-xs font-medium text-slate-300">
              <span className="flex items-center gap-1.5 rounded-xl bg-[#0B132B] px-3 py-1.5 border border-[#223156]">
                <Target className="h-3.5 w-3.5 text-[#48CAE4]" /> 78%+ Historical Accuracy
              </span>
              <span className="flex items-center gap-1.5 rounded-xl bg-[#0B132B] px-3 py-1.5 border border-[#223156]">
                <Cpu className="h-3.5 w-3.5 text-[#48CAE4]" /> Automated Poisson Matrix
              </span>
              <span className="flex items-center gap-1.5 rounded-xl bg-[#0B132B] px-3 py-1.5 border border-[#223156]">
                <Trophy className="h-3.5 w-3.5 text-amber-400" /> Banker of the Day
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Core Date-Filtered Predictions Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Daily Football Predictions
            </h2>
            <p className="text-xs text-slate-400">
              Select Yesterday for audited score outcomes, Today for live tips, or Tomorrow & future dates for early line value.
            </p>
          </div>
          <Link
            href="/vip"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
          >
            <span>VIP Lounge</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <PredictionsFeed
          initialDate={todayStr}
          yesterdayStr={yesterdayStr}
          todayStr={todayStr}
          tomorrowStr={tomorrowStr}
          userProfile={profile}
        />
      </section>
    </div>
  );
}



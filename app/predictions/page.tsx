import React from 'react';
import PredictionsFeed from '@/components/PredictionsFeed';
import { getCurrentUserProfile } from '@/lib/db';
import { getRequestLocale } from '@/lib/i18n/server';
import { getPageMetadata } from '@/lib/site-content';

export async function generateMetadata() {
  return getPageMetadata('/predictions', await getRequestLocale(), {
    title: 'Football Predictions | SabiPredict AI',
    description: 'Date-filtered football predictions and settled outcomes.',
  });
}

export default async function PredictionsPage() {
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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Today&apos;s Top Football Tips & Predictions
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-400">
          AI-driven match predictions, live team stats, and verified low-risk football betting tips.
        </p>
      </div>

      <PredictionsFeed
        initialDate={todayStr}
        yesterdayStr={yesterdayStr}
        todayStr={todayStr}
        tomorrowStr={tomorrowStr}
        userProfile={profile}
      />
    </div>
  );
}


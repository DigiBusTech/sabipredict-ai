import React from 'react';
import PredictionsFeed from '@/components/PredictionsFeed';
import { getCurrentUserProfile } from '@/lib/db';

export const metadata = {
  title: 'Football Predictions & Value Bets | SabiPredict AI',
  description: 'AI-calculated football betting predictions, expected goals (xG) metrics, and value tips for today, tomorrow, and past historical matches.',
};

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


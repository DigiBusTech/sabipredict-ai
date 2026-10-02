'use client';

import React, { useEffect, useState } from 'react';
import { LoaderCircle, Trophy } from 'lucide-react';
import DateSelectorBar from '@/components/DateSelectorBar';
import PredictionCard from '@/components/PredictionCard';
import { Prediction } from '@/lib/types';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function VipPredictionsFeed({
  initialDate,
  yesterdayStr,
  todayStr,
  tomorrowStr,
  isVipMember,
}: {
  initialDate: string;
  yesterdayStr: string;
  todayStr: string;
  tomorrowStr: string;
  isVipMember: boolean;
}) {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [snapshot, setSnapshot] = useState<{ date: string; predictions: Prediction[] } | null>(null);
  const { t } = useTranslation();
  const loading = isVipMember && snapshot?.date !== selectedDate;
  const predictions = snapshot?.date === selectedDate ? snapshot.predictions : [];
  const rankedPredictions = [...predictions].sort((left, right) => right.confidence_score - left.confidence_score);
  const featuredPrediction = rankedPredictions[0];
  const remainingPredictions = rankedPredictions.slice(1);

  useEffect(() => {
    if (!isVipMember) return;
    let active = true;
    fetch(`/api/predictions?date=${encodeURIComponent(selectedDate)}&status=approved&tier=vip`, { cache: 'no-store' })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || 'Could not load VIP predictions.');
        if (active) setSnapshot({ date: selectedDate, predictions: result.data || [] });
      })
      .catch(() => {
        if (active) setSnapshot({ date: selectedDate, predictions: [] });
      });

    return () => { active = false; };
  }, [isVipMember, selectedDate]);

  const dateLabel = selectedDate === todayStr ? 'today' : selectedDate === yesterdayStr ? 'yesterday' : selectedDate;

  return (
    <section className="space-y-5" aria-label="Date-filtered VIP predictions">
      <DateSelectorBar
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        yesterdayStr={yesterdayStr}
        todayStr={todayStr}
        tomorrowStr={tomorrowStr}
        predictionsCount={predictions.length}
      />

      {loading ? (
        <div className="flex min-h-40 items-center justify-center gap-2 text-xs text-slate-400" role="status">
          <LoaderCircle className="h-4 w-4 animate-spin text-amber-300" /> {t('vip.loading')} · {dateLabel}…
        </div>
      ) : predictions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#33415F] bg-[#111C38]/50 px-5 py-12 text-center">
          <Trophy className="mx-auto mb-2 h-5 w-5 text-slate-500" />
          <p className="text-sm font-bold text-slate-300">{t('vip.noSelections')} · {dateLabel}</p>
          <p className="mt-1 text-xs text-slate-500">{t('vip.noSelectionsDescription')}</p>
        </div>
      ) : (
        <>
        {featuredPrediction && <section aria-labelledby="vip-featured-pick" className="space-y-3">
          <div className="flex flex-wrap items-center gap-2"><Trophy className="h-5 w-5 text-amber-300" /><h2 id="vip-featured-pick" className="text-sm font-black text-white">{t('vip.topPick')}</h2><span className="rounded-md border border-amber-400/25 bg-amber-400/10 px-2 py-1 text-[9px] font-bold text-amber-200">{t('vip.topPickBadge')}</span></div>
          <div className="max-w-2xl"><PredictionCard prediction={featuredPrediction} isVipMember={isVipMember} /></div>
        </section>}
        {remainingPredictions.length > 0 && <section className="space-y-3"><h2 className="text-sm font-black text-white">{t('vip.title')}</h2><div className="grid grid-cols-1 gap-4 md:grid-cols-2">{remainingPredictions.map((prediction) => <PredictionCard key={prediction.id} prediction={prediction} isVipMember={isVipMember} />)}</div></section>}
        </>
      )}
    </section>
  );
}
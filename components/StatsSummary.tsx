import React from 'react';
import { TrendingUp, Target, Award, CheckCircle2 } from 'lucide-react';
import { Prediction } from '@/lib/types';

interface StatsSummaryProps {
  predictions: Prediction[];
  dateLabel: string;
}

export default function StatsSummary({ predictions, dateLabel }: StatsSummaryProps) {
  const total = predictions.length;
  if (total === 0) return null;

  const avgOdds = (
    predictions.reduce((acc, p) => acc + Number(p.odds), 0) / total
  ).toFixed(2);

  const highConfCount = predictions.filter((p) => p.confidence_score >= 80).length;

  const settled = predictions.filter(
    (p) => p.prediction_outcome === 'Won' || p.prediction_outcome === 'Lost'
  );
  const wonCount = predictions.filter((p) => p.prediction_outcome === 'Won').length;
  const winRate = settled.length > 0 ? Math.round((wonCount / settled.length) * 100) : null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
      <div className="rounded-xl border border-[#1C2541] bg-[#111C38] p-3 shadow-md">
        <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
          <Target className="h-4 w-4 text-[#48CAE4]" />
          <span>Active Tips</span>
        </div>
        <p className="text-xl font-black text-white">{total}</p>
        <p className="text-[10px] text-slate-500 capitalize">{dateLabel}</p>
      </div>

      <div className="rounded-xl border border-[#1C2541] bg-[#111C38] p-3 shadow-md">
        <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
          <TrendingUp className="h-4 w-4 text-[#48CAE4]" />
          <span>Average Odds</span>
        </div>
        <p className="text-xl font-black text-[#48CAE4]">@{avgOdds}</p>
        <p className="text-[10px] text-slate-500">Value aggregated</p>
      </div>

      <div className="rounded-xl border border-[#1C2541] bg-[#111C38] p-3 shadow-md">
        <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
          <Award className="h-4 w-4 text-amber-400" />
          <span>Elite (80%+ Conf)</span>
        </div>
        <p className="text-xl font-black text-amber-400">{highConfCount}</p>
        <p className="text-[10px] text-slate-500">High-conviction edge</p>
      </div>

      <div className="rounded-xl border border-[#1C2541] bg-[#111C38] p-3 shadow-md">
        <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>Settled Accuracy</span>
        </div>
        <p className="text-xl font-black text-white">
          {winRate !== null ? `${winRate}%` : 'Pending'}
        </p>
        <p className="text-[10px] text-slate-500">
          {settled.length > 0 ? `${wonCount}/${settled.length} hit` : 'Live matches'}
        </p>
      </div>
    </div>
  );
}


'use client';

import React, { useState } from 'react';
import { Check, X, Sparkles, Clock, BrainCircuit } from 'lucide-react';
import { Prediction, PredictionTier, PredictionStatus } from '@/lib/types';
import { formatKickoffTime } from '@/lib/utils';

interface AdminPredictionCardProps {
  prediction: Prediction;
  onUpdateStatus: (id: string, status: PredictionStatus, tier?: PredictionTier) => Promise<void>;
}

export default function AdminPredictionCard({
  prediction,
  onUpdateStatus,
}: AdminPredictionCardProps) {
  const [loading, setLoading] = useState(false);

  const handleAction = async (status: PredictionStatus, tier?: PredictionTier) => {
    setLoading(true);
    try {
      await onUpdateStatus(prediction.id, status, tier);
    } finally {
      setLoading(false);
    }
  };

  const kickoff = prediction.match_time ? formatKickoffTime(prediction.match_time) : '18:00';

  return (
    <div className={`rounded-2xl border p-4 sm:p-5 transition-all ${
      prediction.status === 'pending'
        ? 'border-amber-500/40 bg-[#111C38] shadow-md'
        : prediction.status === 'approved'
        ? 'border-emerald-500/40 bg-[#111C38]/80'
        : 'border-[#1C2541] bg-[#0B132B]/60 opacity-70'
    }`}>
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#1C2541] text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#48CAE4]">{prediction.league}</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400 font-mono flex items-center gap-1">
            <Clock className="h-3 w-3 text-slate-500" /> {prediction.match_date} ({kickoff} UTC)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
            prediction.status === 'pending'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : prediction.status === 'approved'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
          }`}>
            {prediction.status}
          </span>
          <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300 uppercase">
            {prediction.tier}
          </span>
        </div>
      </div>

      {/* Match info & Prediction */}
      <div className="py-3">
        <div className="flex items-center justify-between text-sm sm:text-base font-bold text-white mb-2">
          <span>{prediction.home_team}</span>
          <span className="text-xs text-slate-500 font-normal">vs</span>
          <span>{prediction.away_team}</span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#0B132B] p-3 border border-[#1C2541] my-2">
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">
              Market Prediction
            </span>
            <span className="text-base font-extrabold text-[#48CAE4]">
              {prediction.market}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Odds</span>
              <span className="text-sm font-bold text-white">@{Number(prediction.odds).toFixed(2)}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Confidence</span>
              <span className="text-sm font-bold text-emerald-300">{prediction.confidence_score}%</span>
            </div>
          </div>
        </div>

        {/* AI Analysis Preview */}
        <div className="rounded-xl bg-[#0B132B] p-3 border border-[#1C2541] text-xs text-slate-300 leading-relaxed">
          <div className="flex items-center gap-1.5 font-semibold text-[#48CAE4] mb-1">
            <BrainCircuit className="h-3.5 w-3.5" />
            <span>AI Reasoning:</span>
          </div>
          <p>{prediction.ai_analysis}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-2 pt-3 border-t border-[#1C2541] flex flex-wrap items-center justify-end gap-2">
        <button
          disabled={loading}
          onClick={() => handleAction('rejected')}
          className="flex items-center gap-1 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition-all disabled:opacity-50"
        >
          <X className="h-3.5 w-3.5" />
          Reject
        </button>

        <button
          disabled={loading}
          onClick={() => handleAction('approved', 'free')}
          className="flex items-center gap-1 rounded-xl border border-[#3A506B] bg-[#1C2541] px-3.5 py-1.5 text-xs font-bold text-slate-200 hover:text-white transition-all disabled:opacity-50"
        >
          <Check className="h-3.5 w-3.5" />
          Approve (Free Tier)
        </button>

        <button
          disabled={loading}
          onClick={() => handleAction('approved', 'vip')}
          className="flex items-center gap-1 rounded-xl bg-linear-to-r from-amber-500 to-yellow-500 px-4 py-1.5 text-xs font-extrabold text-[#0B132B] shadow-md hover:brightness-110 transition-all disabled:opacity-50"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Approve (VIP Tier)
        </button>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { Trash2, CheckSquare, Square } from 'lucide-react';
import { Prediction, PredictionOutcome } from '@/lib/types';

interface PredictionRowProps {
  prediction: Prediction;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  scores: { home: string; away: string };
  onScoreChange: (home: string, away: string) => void;
  onSettle: (outcome: PredictionOutcome) => void;
  onApprove: (tier: 'free' | 'vip') => void;
  onReject: () => void;
  onDelete: () => void;
}

export default function PredictionRow({
  prediction: p,
  isSelected,
  onToggleSelect,
  scores,
  onScoreChange,
  onSettle,
  onApprove,
  onReject,
  onDelete,
}: PredictionRowProps) {
  return (
    <div
      className={`rounded-2xl border transition p-4 text-xs space-y-3 ${
        isSelected
          ? 'border-[#48CAE4] bg-[#111C38]'
          : 'border-[#1C2541] bg-[#111C38] hover:border-[#223156]'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1C2541] pb-2">
        <div className="flex items-center gap-2 font-bold text-white">
          <button
            type="button"
            onClick={() => onToggleSelect(p.id)}
            className="p-1 text-slate-400 hover:text-white"
          >
            {isSelected ? (
              <CheckSquare className="h-4 w-4 text-[#48CAE4]" />
            ) : (
              <Square className="h-4 w-4 text-slate-500" />
            )}
          </button>
          <span>{p.home_team} vs {p.away_team}</span>
          <span className="text-[#48CAE4]">({p.league})</span>
          <span className="text-slate-400 font-normal">{p.match_date}</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
              p.status === 'pending'
                ? 'bg-amber-500/20 text-amber-300'
                : p.status === 'approved'
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/20 text-rose-300'
            }`}
          >
            {p.status}
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] uppercase font-bold text-slate-300">
            {p.tier}
          </span>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-black ${
              p.prediction_outcome === 'Won'
                ? 'bg-emerald-500/20 text-emerald-400'
                : p.prediction_outcome === 'Lost'
                ? 'bg-rose-500/20 text-rose-400'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {p.prediction_outcome}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-slate-300">
        <div>
          <span className="text-slate-500 block text-[10px]">Market & Odds</span>
          <span className="font-bold text-[#48CAE4]">
            {p.market} @ {Number(p.odds).toFixed(2)}
          </span>
          <span className="ml-2 text-slate-400">({p.confidence_score}% Conf)</span>
        </div>
        <p className="text-slate-400 text-[11px] max-w-xl">{p.ai_analysis}</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#1C2541]">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 text-[11px]">Final Score:</span>
          <input
            type="number"
            placeholder="H"
            value={scores.home}
            onChange={(e) => onScoreChange(e.target.value, scores.away)}
            className="w-12 rounded-lg bg-[#0B132B] border border-[#223156] px-2 py-1 text-center text-white"
          />
          <span>-</span>
          <input
            type="number"
            placeholder="A"
            value={scores.away}
            onChange={(e) => onScoreChange(scores.home, e.target.value)}
            className="w-12 rounded-lg bg-[#0B132B] border border-[#223156] px-2 py-1 text-center text-white"
          />
          <button
            onClick={() => onSettle('Won')}
            className="rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 font-bold hover:bg-emerald-500/30"
          >
            Won
          </button>
          <button
            onClick={() => onSettle('Lost')}
            className="rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2.5 py-1 font-bold hover:bg-rose-500/30"
          >
            Lost
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {p.status === 'pending' && (
            <>
              <button
                onClick={() => onApprove('free')}
                className="rounded-lg bg-[#1C2541] border border-[#3A506B] px-3 py-1 font-bold text-slate-200 hover:text-white"
              >
                Approve Free
              </button>
              <button
                onClick={() => onApprove('vip')}
                className="rounded-lg bg-linear-to-r from-amber-500 to-yellow-500 px-3 py-1 font-black text-[#0B132B]"
              >
                Approve VIP
              </button>
              <button
                onClick={() => onReject()}
                className="rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2.5 py-1 font-bold hover:bg-rose-500/30"
              >
                Reject
              </button>
            </>
          )}
          <button
            onClick={onDelete}
            className="p-1.5 text-slate-500 hover:text-rose-400"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

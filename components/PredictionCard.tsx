'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ChevronDown, ChevronUp, Lock, CheckCircle2, XCircle, 
  Clock, BrainCircuit, Sparkles 
} from 'lucide-react';
import { Prediction } from '@/lib/types';
import { formatKickoffTime } from '@/lib/utils';

export default function PredictionCard({
  prediction,
  isVipMember = false,
}: {
  prediction: Prediction;
  isVipMember?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const isLocked = prediction.tier === 'vip' && !isVipMember;
  const kickoff = prediction.match_time ? formatKickoffTime(prediction.match_time) : '18:00';
  const hasScore = prediction.home_score !== null && prediction.home_score !== undefined;
  const ev = (((prediction.confidence_score - 10) / 100) * prediction.odds - 1) * 100;

  return (
    <div className="overflow-hidden rounded-2xl border border-[#1C2541] bg-[#111C38] shadow-lg">
      <div className="flex items-center justify-between border-b border-[#1C2541] px-4 py-2 bg-[#0B132B]/80 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#48CAE4]">{prediction.league}</span>
          <span className="text-slate-400 font-mono flex items-center gap-1">
            <Clock className="h-3 w-3" /> {kickoff}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {prediction.prediction_outcome === 'Won' && (
            <span className="flex items-center gap-1 rounded bg-emerald-500/20 px-2 py-0.5 text-[11px] font-black text-emerald-400 border border-emerald-500/40">
              <CheckCircle2 className="h-3.5 w-3.5" /> WON
            </span>
          )}
          {prediction.prediction_outcome === 'Lost' && (
            <span className="flex items-center gap-1 rounded bg-rose-500/20 px-2 py-0.5 text-[11px] font-black text-rose-400 border border-rose-500/40">
              <XCircle className="h-3.5 w-3.5" /> LOST
            </span>
          )}
          {prediction.prediction_outcome === 'Pending' && (
            <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
              PENDING
            </span>
          )}
          {prediction.tier === 'vip' ? (
            <span className="flex items-center gap-1 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/40">
              <Sparkles className="h-3 w-3" /> VIP
            </span>
          ) : (
            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">
              FREE

      <div className="p-4">
        <div className="grid grid-cols-7 items-center gap-2 my-1">
          <div className="col-span-3 font-bold text-sm text-white line-clamp-1">{prediction.home_team}</div>
          <div className="col-span-1 text-center">
            {hasScore ? (
              <span className="rounded bg-[#0B132B] px-2 py-0.5 font-mono font-black text-sm text-white border border-[#223156]">
                {prediction.home_score} - {prediction.away_score}
              </span>
            ) : (
              <span className="text-xs font-bold text-slate-500">VS</span>
            )}
          </div>
          <div className="col-span-3 text-right font-bold text-sm text-white line-clamp-1">{prediction.away_team}</div>
        </div>

        {isLocked ? (
          <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-center">
            <Lock className="h-4 w-4 mx-auto text-amber-400 mb-1" />
            <h4 className="text-xs font-bold text-amber-200">VIP PREDICTION LOCKED</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">High-confidence ({prediction.confidence_score}%) pick for VIP members.</p>
            <Link href="/pricing" className="mt-2.5 inline-flex items-center gap-1 rounded-xl bg-linear-to-r from-amber-500 to-yellow-500 px-3.5 py-1 text-xs font-bold text-[#0B132B]">
              <Sparkles className="h-3 w-3" /> Upgrade to VIP
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-3 flex items-center justify-between rounded-xl bg-[#0B132B] p-2.5 border border-[#1C2541]">
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">AI Market</span>
                <span className="text-sm font-extrabold text-[#48CAE4]">{prediction.market}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-[#1C2541] px-2 py-0.5 text-sm font-extrabold text-white border border-[#223156]">
                  @{Number(prediction.odds).toFixed(2)}
                </span>
                <span className="rounded px-1.5 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {ev > 0 ? `+${ev.toFixed(1)}% EV` : `${ev.toFixed(1)}% EV`}
                </span>
              </div>
            </div>

            <div className="mt-2">
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-400">Confidence</span>
                <span className="font-bold text-white">{prediction.confidence_score}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-[#1C2541] overflow-hidden">
                <div className="h-full bg-linear-to-r from-[#48CAE4] to-[#0077B6]" style={{ width: `${prediction.confidence_score}%` }} />
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-[#1C2541]">
              <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between text-xs font-semibold text-slate-300 hover:text-[#48CAE4]">
                <span className="flex items-center gap-1">
                  <BrainCircuit className="h-3.5 w-3.5 text-[#48CAE4]" /> AI Tactical Analysis
                </span>
                {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
              {open && (
                <div className="mt-2 rounded-xl bg-[#0B132B] p-2.5 text-xs text-slate-300 border border-[#1C2541] leading-relaxed">
                  {prediction.ai_analysis}
                </div>
              )}
            </div>
          </>
        )}
      </div>

            </span>
          )}
        </div>
      </div>
    </div>
  );
}

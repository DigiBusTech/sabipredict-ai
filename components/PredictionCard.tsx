'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ChevronDown, ChevronUp, Lock, CheckCircle2, XCircle, 
  Clock, BrainCircuit, Sparkles, BarChart2 
} from 'lucide-react';
import { Prediction } from '@/lib/types';
import { formatKickoffTime } from '@/lib/utils';
import PredictionAnalytics from './PredictionAnalytics';

export default function PredictionCard({
  prediction,
  isVipMember = false,
}: {
  prediction: Prediction;
  isVipMember?: boolean;
}) {
  const [openAnalysis, setOpenAnalysis] = useState(false);
  const [openAnalytics, setOpenAnalytics] = useState(false);

  const isCoreLocked = prediction.tier === 'vip' && !isVipMember;
  const kickoff = prediction.match_time ? formatKickoffTime(prediction.match_time) : '18:00';
  const hasScore = prediction.home_score !== null && prediction.home_score !== undefined;
  const ev = (((prediction.confidence_score - 10) / 100) * prediction.odds - 1) * 100;

  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 sm:p-5 mb-4 shadow-lg transition-all hover:border-slate-700">
      {/* Card Header: League + Kickoff on left; Outcome + Tier on right */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-black text-cyan-400 text-xs sm:text-sm">{prediction.league}</span>
          <span className="text-slate-400 font-mono text-[11px] sm:text-xs flex items-center gap-1">
            <Clock className="h-3 w-3" /> {kickoff}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {prediction.prediction_outcome === 'Won' && (
            <span className="flex items-center gap-1 rounded-md bg-emerald-500/20 px-2 py-0.5 text-[11px] font-black text-emerald-400 border border-emerald-500/40">
              <CheckCircle2 className="h-3.5 w-3.5" /> WON
            </span>
          )}
          {prediction.prediction_outcome === 'Lost' && (
            <span className="flex items-center gap-1 rounded-md bg-rose-500/20 px-2 py-0.5 text-[11px] font-black text-rose-400 border border-rose-500/40">
              <XCircle className="h-3.5 w-3.5" /> LOST
            </span>
          )}
          {prediction.prediction_outcome === 'Pending' && (
            <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30">
              PENDING
            </span>
          )}
          {prediction.tier === 'vip' ? (
            <span className="flex items-center gap-1 rounded-md bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/40">
              <Sparkles className="h-3 w-3" /> VIP
            </span>
          ) : (
            <span className="rounded-md bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 border border-slate-700">
              FREE
            </span>
          )}
        </div>
      </div>

      {/* Match Teams & Centered Scores Pill */}
      <div className="space-y-3">
        <div className="grid grid-cols-7 items-center gap-2 my-2">
          <div className="col-span-3 font-bold text-sm sm:text-base text-white text-left truncate" title={prediction.home_team}>
            {prediction.home_team}
          </div>
          <div className="col-span-1 flex justify-center">
            {hasScore ? (
              <span className="bg-slate-950 px-3 py-1 rounded-lg font-bold text-lg font-mono text-white border border-slate-800 shadow-inner">
                {prediction.home_score} - {prediction.away_score}
              </span>
            ) : (
              <span className="bg-slate-950 px-3 py-1 rounded-lg font-bold text-xs sm:text-sm text-slate-400 border border-slate-800">
                VS
              </span>
            )}
          </div>
          <div className="col-span-3 font-bold text-sm sm:text-base text-white text-right truncate" title={prediction.away_team}>
            {prediction.away_team}
          </div>
        </div>

        {/* Core Prediction Box */}
        {isCoreLocked ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-center">
            <Lock className="h-4 w-4 mx-auto text-amber-400 mb-1" />
            <h4 className="text-xs font-bold text-amber-200">VIP PREDICTION LOCKED</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">High-confidence ({prediction.confidence_score}%) pick reserved for VIP members.</p>
            <Link href="/pricing" className="mt-2.5 inline-flex items-center gap-1 rounded-xl bg-linear-to-r from-amber-500 to-yellow-500 px-3.5 py-1 text-xs font-bold text-[#0B132B]">
              <Sparkles className="h-3 w-3" /> Upgrade to VIP
            </Link>
          </div>
        ) : (
          <>
            {/* High-Contrast AI Prediction Market Container */}
            <div className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-xl p-3 flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  AI Market
                </span>
                <span className="text-sm sm:text-base font-black text-cyan-400">
                  {prediction.market}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-slate-800 px-2.5 py-1 text-sm font-extrabold text-white border border-slate-700">
                  @{Number(prediction.odds).toFixed(2)}
                </span>
                <span className="rounded-md px-1.5 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {ev > 0 ? `+${ev.toFixed(1)}% EV` : `${ev.toFixed(1)}% EV`}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Model Probability</span>
                <span className="font-bold text-white">{prediction.confidence_score}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-linear-to-r from-cyan-500 to-cyan-400" style={{ width: `${prediction.confidence_score}%` }} />
              </div>
            </div>

            {/* AI Tactical Analysis Accordion */}
            <div className="pt-2 border-t border-slate-800">
              <button 
                onClick={() => setOpenAnalysis(!openAnalysis)} 
                className="flex w-full items-center justify-between text-xs font-semibold text-slate-300 hover:text-cyan-400 transition-colors py-1 cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <BrainCircuit className="h-4 w-4 text-cyan-400" /> AI Tactical Rationale
                </span>
                {openAnalysis ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
              {openAnalysis && (
                <div className="mt-2 rounded-xl bg-slate-950/70 p-3 text-xs text-slate-300 border border-slate-800 leading-relaxed animate-in fade-in">
                  {prediction.ai_analysis}
                </div>
              )}
            </div>
          </>
        )}

        {/* Extended VIP Match Analytics Accordion Button */}
        <div className="pt-2 border-t border-slate-800">
          <button
            onClick={() => setOpenAnalytics(!openAnalytics)}
            className={`flex w-full items-center justify-between rounded-xl p-2.5 text-xs font-bold transition-all cursor-pointer ${
              openAnalytics
                ? 'bg-slate-800 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'bg-slate-950/60 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <BarChart2 className="h-4 w-4 text-amber-400" />
              <span>Match Analytics, Form & Telemetry</span>
              {!isVipMember && (
                <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-black text-amber-300 border border-amber-500/40">
                  VIP
                </span>
              )}
            </span>
            {openAnalytics ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          {openAnalytics && (
            <PredictionAnalytics
              prediction={prediction}
              isVipMember={isVipMember}
            />
          )}
        </div>
      </div>
    </div>
  );
}
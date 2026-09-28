'use client';

import React, { useState } from 'react';
import { 
  RefreshCw, Sparkles, Plus, CheckCircle2, XCircle, Clock, 
  Trash2 
} from 'lucide-react';
import { Prediction } from '@/lib/types';
import { 
  approvePredictionAction, 
  rejectPredictionAction, 
  settlePredictionAction, 
  deletePredictionAction,
  triggerSyncSportsmonksAction,
  triggerGenerateAITipsAction,
  createManualPredictionAction
} from '@/app/actions/predictions';

export default function PredictionsTab({ predictions }: { predictions: Prediction[] }) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [scoreInputs, setScoreInputs] = useState<Record<string, { home: string; away: string }>>({});

  const handleAction = async (id: string, actionFn: () => Promise<any>, actionName: string) => {
    setLoadingAction(id);
    try {
      const res = await actionFn();
      setMsg(res?.message || `${actionName} completed.`);
      setTimeout(() => setMsg(null), 4000);
    } catch (err: any) {
      setMsg(err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSettle = (id: string, outcome: 'Won' | 'Lost' | 'Void') => {
    const scores = scoreInputs[id] || { home: '0', away: '0' };
    const h = parseInt(scores.home || '0', 10);
    const a = parseInt(scores.away || '0', 10);
    handleAction(id, () => settlePredictionAction(id, h, a, outcome), `Settled as ${outcome}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#111C38] p-4 border border-[#1C2541]">
        <div>
          <h2 className="text-base font-black text-white">Live Predictions Moderation</h2>
          <p className="text-xs text-slate-400">Ingest fixtures, calculate AI probabilities, and settle final scores.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            disabled={!!loadingAction}
            onClick={() => handleAction('sync', triggerSyncSportsmonksAction, 'Sportsmonks Sync')}
            className="flex items-center gap-1.5 rounded-xl border border-[#223156] bg-[#0B132B] px-3.5 py-2 text-xs font-semibold hover:border-[#48CAE4] disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-[#48CAE4] ${loadingAction === 'sync' ? 'animate-spin' : ''}`} />
            <span>Sync Sportsmonks</span>
          </button>

          <button
            disabled={!!loadingAction}
            onClick={() => handleAction('ai', triggerGenerateAITipsAction, 'AI Model Generation')}
            className="flex items-center gap-1.5 rounded-xl bg-[#48CAE4] px-4 py-2 text-xs font-black text-[#0B132B] hover:bg-[#00B4D8] disabled:opacity-50"
          >
            <Sparkles className={`h-3.5 w-3.5 ${loadingAction === 'ai' ? 'animate-bounce' : ''}`} />
            <span>Generate AI Tips</span>
          </button>

          <button
            onClick={() => setShowManualForm(!showManualForm)}
            className="flex items-center gap-1.5 rounded-xl border border-[#3A506B] bg-[#1C2541] px-3 py-2 text-xs font-semibold text-slate-200"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Manual Tip</span>
          </button>
        </div>
      </div>

      {msg && (
        <div className="rounded-xl border border-[#48CAE4]/40 bg-[#48CAE4]/10 p-3 text-xs text-[#48CAE4]">
          {msg}
        </div>
      )}

      {showManualForm && (
        <form
          action={async (formData) => {
            await createManualPredictionAction(formData);
            setShowManualForm(false);
          }}
          className="rounded-2xl border border-[#223156] bg-[#111C38] p-5 space-y-3 text-xs"
        >
          <h3 className="font-bold text-white text-sm">Add Custom Prediction</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input name="home_team" placeholder="Home Team" required className="rounded-xl bg-[#0B132B] border border-[#223156] px-3 py-2 text-white" />
            <input name="away_team" placeholder="Away Team" required className="rounded-xl bg-[#0B132B] border border-[#223156] px-3 py-2 text-white" />
            <input name="league" placeholder="League" required className="rounded-xl bg-[#0B132B] border border-[#223156] px-3 py-2 text-white" />
            <input name="match_date" type="date" required className="rounded-xl bg-[#0B132B] border border-[#223156] px-3 py-2 text-white" />
            <input name="market" placeholder="Market (e.g. Over 2.5)" required className="rounded-xl bg-[#0B132B] border border-[#223156] px-3 py-2 text-white" />
            <input name="odds" type="number" step="0.01" placeholder="Odds (1.80)" required className="rounded-xl bg-[#0B132B] border border-[#223156] px-3 py-2 text-white" />
            <input name="confidence_score" type="number" placeholder="Confidence %" defaultValue="80" className="rounded-xl bg-[#0B132B] border border-[#223156] px-3 py-2 text-white" />
            <select name="tier" className="rounded-xl bg-[#0B132B] border border-[#223156] px-3 py-2 text-white">
              <option value="free">Free Tier</option>
              <option value="vip">VIP Lounge</option>
            </select>
          </div>
          <textarea name="ai_analysis" placeholder="AI analysis rationale..." rows={2} className="w-full rounded-xl bg-[#0B132B] border border-[#223156] p-2.5 text-white" />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowManualForm(false)} className="px-3 py-1 text-slate-400">Cancel</button>
            <button type="submit" className="rounded-xl bg-[#48CAE4] px-4 py-1.5 font-bold text-[#0B132B]">Save</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {predictions.map((p) => {
          const scores = scoreInputs[p.id] || {
            home: p.home_score !== null && p.home_score !== undefined ? String(p.home_score) : '',
            away: p.away_score !== null && p.away_score !== undefined ? String(p.away_score) : '',
          };

          return (
            <div key={p.id} className="rounded-2xl border border-[#1C2541] bg-[#111C38] p-4 text-xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1C2541] pb-2">
                <div className="flex items-center gap-2 font-bold text-white">
                  <span>{p.home_team} vs {p.away_team}</span>
                  <span className="text-[#48CAE4]">({p.league})</span>
                  <span className="text-slate-400 font-normal">{p.match_date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    p.status === 'pending' ? 'bg-amber-500/20 text-amber-300' : p.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    {p.status}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] uppercase font-bold text-slate-300">
                    {p.tier}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                    p.prediction_outcome === 'Won' ? 'bg-emerald-500/20 text-emerald-400' : p.prediction_outcome === 'Lost' ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {p.prediction_outcome}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 text-slate-300">
                <div>
                  <span className="text-slate-500 block text-[10px]">Market & Odds</span>
                  <span className="font-bold text-[#48CAE4]">{p.market} @ {Number(p.odds).toFixed(2)}</span>
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
                    onChange={(e) => setScoreInputs({ ...scoreInputs, [p.id]: { ...scores, home: e.target.value } })}
                    className="w-12 rounded-lg bg-[#0B132B] border border-[#223156] px-2 py-1 text-center text-white"
                  />
                  <span>-</span>
                  <input
                    type="number"
                    placeholder="A"
                    value={scores.away}
                    onChange={(e) => setScoreInputs({ ...scoreInputs, [p.id]: { ...scores, away: e.target.value } })}
                    className="w-12 rounded-lg bg-[#0B132B] border border-[#223156] px-2 py-1 text-center text-white"
                  />
                  <button onClick={() => handleSettle(p.id, 'Won')} className="rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 font-bold">
                    Won
                  </button>
                  <button onClick={() => handleSettle(p.id, 'Lost')} className="rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2.5 py-1 font-bold">
                    Lost
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  {p.status === 'pending' && (
                    <>
                      <button onClick={() => handleAction(p.id, () => approvePredictionAction(p.id, 'free'), 'Approved Free')} className="rounded-lg bg-[#1C2541] border border-[#3A506B] px-3 py-1 font-bold text-slate-200">
                        Approve Free
                      </button>
                      <button onClick={() => handleAction(p.id, () => approvePredictionAction(p.id, 'vip'), 'Approved VIP')} className="rounded-lg bg-linear-to-r from-amber-500 to-yellow-500 px-3 py-1 font-black text-[#0B132B]">
                        Approve VIP
                      </button>
                      <button onClick={() => handleAction(p.id, () => rejectPredictionAction(p.id), 'Rejected')} className="rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2.5 py-1 font-bold">
                        Reject
                      </button>
                    </>
                  )}
                  <button onClick={() => handleAction(p.id, () => deletePredictionAction(p.id), 'Deleted')} className="p-1.5 text-slate-500 hover:text-rose-400">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


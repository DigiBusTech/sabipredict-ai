'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Lock, Crown, Sparkles, AlertTriangle, ShieldCheck, 
  Activity, TrendingUp, Users, BarChart3, ChevronRight,
  Loader2, Info
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  Tooltip, BarChart, Bar, Cell
} from 'recharts';
import { Prediction, MatchAnalytics } from '@/lib/types';
import { getEmptyAnalytics } from '@/lib/analytics-service';

export default function PredictionAnalytics({
  prediction,
  isVipMember = false,
  initialAnalytics,
}: {
  prediction: Prediction;
  isVipMember?: boolean;
  initialAnalytics?: MatchAnalytics;
}) {
  const [activeTab, setActiveTab] = useState<'charts' | 'form' | 'injuries' | 'stats'>('charts');
  const [analytics, setAnalytics] = useState<MatchAnalytics | null>(initialAnalytics || null);
  const [loading, setLoading] = useState<boolean>(!initialAnalytics && isVipMember);

  useEffect(() => {
    if (!isVipMember) return;
    if (analytics) return;

    let active = true;
    setLoading(true);

    fetch(`/api/predictions/${prediction.id}/analytics`)
      .then((res) => res.json())
      .then((json) => {
        if (!active) return;
        if (json.success && json.data) {
          setAnalytics(json.data);
        } else {
          setAnalytics(getEmptyAnalytics());
        }
        setLoading(false);
      })
      .catch((err) => {
        console.warn('[PredictionAnalytics] Failed to fetch VIP analytics:', err);
        if (active) {
          setAnalytics(getEmptyAnalytics());
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [isVipMember, prediction.id, analytics]);

  // If not VIP, display the blurred lock card
  if (!isVipMember) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-[#0B132B]/90 mt-3 p-6 text-center">
        {/* Background dummy preview blurred */}
        <div className="absolute inset-0 filter blur-md opacity-25 pointer-events-none select-none p-4 space-y-4">
          <div className="h-32 w-full bg-linear-to-r from-[#48CAE4]/30 to-[#F59E0B]/30 rounded-xl" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-slate-800 rounded-xl" />
            <div className="h-20 bg-slate-800 rounded-xl" />
          </div>
        </div>

        {/* Foreground Lock Card */}
        <div className="relative z-10 max-w-md mx-auto space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-tr from-amber-500 to-yellow-500 text-[#0B132B] shadow-lg shadow-amber-500/20">
            <Lock className="h-6 w-6 stroke-[2.5]" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-300 mb-1">
              <Crown className="h-3 w-3" /> VIP Exclusive Telemetry
            </div>
            <h4 className="text-sm sm:text-base font-black text-white">
              Unlock Deep Form, H2H & Injury Analytics
            </h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Extended Poisson telemetry, 5-match xG trend curves, head-to-head win distributions, and medical injury rosters are reserved for VIP Lounge members.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1.5 rounded-xl bg-linear-to-r from-amber-500 to-yellow-500 px-4 py-2 text-xs font-black text-[#0B132B] shadow-md hover:brightness-110 transition"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Unlock VIP Analytics</span>
            </Link>
            <Link
              href="/vip"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#3A506B] bg-[#1C2541] px-3.5 py-2 text-xs font-bold text-slate-200 hover:text-white transition"
            >
              <span>Explore VIP Lounge</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // VIP Loading State
  if (loading || !analytics) {
    return (
      <div className="mt-3 rounded-2xl border border-[#48CAE4]/30 bg-[#0B132B] p-6 text-xs text-center space-y-3">
        <Loader2 className="h-6 w-6 text-[#48CAE4] animate-spin mx-auto" />
        <div className="text-xs font-bold text-white">Resolving VIP Telemetry & Verified Form...</div>
        <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
          Querying validated provider records and checking historical league context.
        </p>
      </div>
    );
  }

  // Verification flags
  const hasH2h = (analytics.h2h_matches?.length || 0) > 0;
  const hasXgTrends = (analytics.xg_trends?.length || 0) > 0;
  const hasHomeForm = (analytics.home_form?.length || 0) > 0;
  const hasAwayForm = (analytics.away_form?.length || 0) > 0;
  const hasInjuries = (analytics.injuries?.length || 0) > 0;
  const hasStats = (analytics.stats?.length || 0) > 0;

  // VIP Full Visual Analytics
  const h2hBarData = [
    { name: prediction.home_team, wins: analytics.h2h_summary?.home_wins || 0, fill: '#48CAE4' },
    { name: 'Draws', wins: analytics.h2h_summary?.draws || 0, fill: '#64748B' },
    { name: prediction.away_team, wins: analytics.h2h_summary?.away_wins || 0, fill: '#F59E0B' },
  ];

  return (
    <div className="mt-3 rounded-2xl border border-[#48CAE4]/40 bg-[#0B132B] p-4 text-xs space-y-4 shadow-xl">
      {/* Sub-tab Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1C2541] pb-3">
        <div className="flex items-center gap-1.5 font-bold text-white text-xs">
          <Activity className="h-4 w-4 text-[#48CAE4]" />
          <span>VIP Match Intelligence</span>
        </div>

        <div className="flex items-center gap-1 rounded-xl bg-[#111C38] p-1 border border-[#1C2541]">
          <button
            onClick={() => setActiveTab('charts')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
              activeTab === 'charts' ? 'bg-[#48CAE4] text-[#0B132B]' : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="h-3 w-3" />
            <span>xG & H2H Charts</span>
          </button>
          <button
            onClick={() => setActiveTab('form')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
              activeTab === 'form' ? 'bg-[#48CAE4] text-[#0B132B]' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="h-3 w-3" />
            <span>Form Guide</span>
          </button>
          <button
            onClick={() => setActiveTab('injuries')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
              activeTab === 'injuries' ? 'bg-[#48CAE4] text-[#0B132B]' : 'text-slate-400 hover:text-white'
            }`}
          >
            <AlertTriangle className="h-3 w-3 text-amber-400" />
            <span>Injuries ({analytics.injuries.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
              activeTab === 'stats' ? 'bg-[#48CAE4] text-[#0B132B]' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="h-3 w-3" />
            <span>Team Stats</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Charts (xG Trend & H2H Bar Chart) */}
      {activeTab === 'charts' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {!hasXgTrends && !hasH2h ? (
            <div className="rounded-xl bg-[#111C38] p-6 text-center border border-[#1C2541] space-y-2">
              <BarChart3 className="h-8 w-8 text-slate-500 mx-auto" />
              <div className="text-sm font-bold text-white">xG Telemetry & H2H Unavailable</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Historical expected goals (xG) curves and direct head-to-head records are not available for this matchup.
              </p>
            </div>
          ) : (
            <>
              {hasXgTrends && (
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-2">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-[#48CAE4]" /> 5-Match xG Performance Curve
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-[10px] text-[#48CAE4]">
                        <span className="h-2 w-2 rounded-full bg-[#48CAE4]" /> {prediction.home_team}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-amber-400">
                        <span className="h-2 w-2 rounded-full bg-amber-400" /> {prediction.away_team}
                      </span>
                    </div>
                  </div>
                  <div className="h-44 w-full rounded-xl bg-[#111C38] p-2 border border-[#1C2541]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics.xg_trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="homeGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#48CAE4" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#48CAE4" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="awayGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="match_num" tick={{ fill: '#94A3B8', fontSize: 10 }} stroke="#334155" />
                        <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} stroke="#334155" domain={[0, 3.5]} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0B132B', borderColor: '#3A506B', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
                        />
                        <Area type="monotone" dataKey="home_xg" name={prediction.home_team} stroke="#48CAE4" strokeWidth={2.5} fillOpacity={1} fill="url(#homeGrad)" />
                        <Area type="monotone" dataKey="away_xg" name={prediction.away_team} stroke="#F59E0B" strokeWidth={2.5} fillOpacity={1} fill="url(#awayGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {hasH2h && (
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-2 font-bold text-white">
                    <span>Head-to-Head Win Distribution (Last 5 Meetings)</span>
                    <span className="text-slate-400 font-normal">Total Goals: {analytics.h2h_summary?.total_goals ?? 0}</span>
                  </div>
                  <div className="h-28 w-full rounded-xl bg-[#111C38] p-2 border border-[#1C2541]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={h2hBarData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" tick={{ fill: '#E2E8F0', fontSize: 10, fontWeight: 'bold' }} stroke="transparent" width={110} />
                        <Tooltip contentStyle={{ backgroundColor: '#0B132B', borderColor: '#3A506B', borderRadius: '8px', fontSize: '11px' }} />
                        <Bar dataKey="wins" radius={[0, 8, 8, 0]}>
                          {h2hBarData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Tab 2: Form Guide */}
      {activeTab === 'form' && (
        <div className="space-y-3 animate-in fade-in duration-200">
          {!hasHomeForm && !hasAwayForm ? (
            <div className="rounded-xl bg-[#111C38] p-6 text-center border border-[#1C2541] space-y-2">
              <Activity className="h-8 w-8 text-slate-500 mx-auto" />
              <div className="text-sm font-bold text-white">
                Detailed form data unavailable for this fixture
              </div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Historical match records and verified form guide are not indexed for {prediction.home_team} vs {prediction.away_team} in {prediction.league}.
              </p>
            </div>
          ) : (
            <>
              {/* Home Form */}
              <div className="rounded-xl bg-[#111C38] p-3 border border-[#1C2541] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">{prediction.home_team} (Last 5 Games)</span>
                  {hasHomeForm && (
                    <div className="flex gap-1.5">
                      {analytics.home_form.map((f, i) => (
                        <span
                          key={i}
                          title={`${f.opponent} (${f.score}) - ${f.league || 'Match'}`}
                          className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-black text-[#0B132B] ${
                            f.result === 'W' ? 'bg-emerald-400' : f.result === 'D' ? 'bg-amber-400' : 'bg-rose-400'
                          }`}
                        >
                          {f.result}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {hasHomeForm ? (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-[10px] text-slate-300">
                    {analytics.home_form.map((f, i) => (
                      <div key={i} className="rounded-lg bg-[#0B132B] p-1.5 border border-[#1C2541]">
                        <div className="text-slate-400 truncate">{f.is_home ? 'vs' : '@'} {f.opponent}</div>
                        <div className="font-bold text-white">{f.score}</div>
                        <div className="text-[#48CAE4] font-medium truncate">
                          {f.xg !== undefined ? `${f.xg} xG` : f.league || f.date}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-slate-400 text-xs py-2">
                    Detailed form data unavailable for {prediction.home_team}
                  </div>
                )}
              </div>

              {/* Away Form */}
              <div className="rounded-xl bg-[#111C38] p-3 border border-[#1C2541] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">{prediction.away_team} (Last 5 Games)</span>
                  {hasAwayForm && (
                    <div className="flex gap-1.5">
                      {analytics.away_form.map((f, i) => (
                        <span
                          key={i}
                          title={`${f.opponent} (${f.score}) - ${f.league || 'Match'}`}
                          className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-black text-[#0B132B] ${
                            f.result === 'W' ? 'bg-emerald-400' : f.result === 'D' ? 'bg-amber-400' : 'bg-rose-400'
                          }`}
                        >
                          {f.result}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {hasAwayForm ? (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-[10px] text-slate-300">
                    {analytics.away_form.map((f, i) => (
                      <div key={i} className="rounded-lg bg-[#0B132B] p-1.5 border border-[#1C2541]">
                        <div className="text-slate-400 truncate">{f.is_home ? 'vs' : '@'} {f.opponent}</div>
                        <div className="font-bold text-white">{f.score}</div>
                        <div className="text-amber-400 font-medium truncate">
                          {f.xg !== undefined ? `${f.xg} xG` : f.league || f.date}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-slate-400 text-xs py-2">
                    Detailed form data unavailable for {prediction.away_team}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab 3: Injuries & Roster Alerts */}
      {activeTab === 'injuries' && (
        <div className="space-y-2 animate-in fade-in duration-200">
          {!hasInjuries ? (
            <div className="rounded-xl bg-[#111C38] p-6 text-center border border-[#1C2541] space-y-2">
              <ShieldCheck className="h-8 w-8 text-emerald-400 mx-auto" />
              <div className="text-sm font-bold text-white">No Verified Injuries Reported</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Both squads currently have no officially reported missing, suspended, or sidelined players on record for this fixture.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span>Verified Missing & Doubtful Personnel</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> Medical Report Synced
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {analytics.injuries.map((inj, i) => (
                  <div key={i} className="rounded-xl bg-[#111C38] p-2.5 border border-[#1C2541] flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="font-bold text-white text-xs">{inj.player}</div>
                      <div className="text-[10px] text-slate-400">{inj.team} • {inj.position}</div>
                      <p className="text-[10px] text-slate-300 italic">{inj.reason}</p>
                    </div>
                    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-black uppercase ${
                      inj.status === 'Out'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : inj.status === 'Suspended'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}>
                      {inj.status}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab 4: Team Match Statistics */}
      {activeTab === 'stats' && (
        <div className="space-y-2.5 animate-in fade-in duration-200">
          {!hasStats ? (
            <div className="rounded-xl bg-[#111C38] p-6 text-center border border-[#1C2541] space-y-2">
              <TrendingUp className="h-8 w-8 text-slate-500 mx-auto" />
              <div className="text-sm font-bold text-white">Comparative Statistics Unavailable</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Detailed comparative season statistics are not currently available for this fixture.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 text-center text-[10px] font-bold text-slate-400 border-b border-[#1C2541] pb-1.5">
                <span className="text-left text-[#48CAE4]">{prediction.home_team}</span>
                <span>Season Metric</span>
                <span className="text-right text-amber-400">{prediction.away_team}</span>
              </div>

              <div className="space-y-2">
                {analytics.stats.map((s, i) => {
                  const total = s.homeValue + s.awayValue || 1;
                  const homePct = (s.homeValue / total) * 100;
                  return (
                    <div key={i} className="space-y-1">
                      <div className="grid grid-cols-3 text-center text-xs">
                        <span className="text-left font-mono font-bold text-white">
                          {s.homeValue}{s.unit || ''}
                        </span>
                        <span className="text-[11px] text-slate-300 font-semibold">{s.label}</span>
                        <span className="text-right font-mono font-bold text-white">
                          {s.awayValue}{s.unit || ''}
                        </span>
                      </div>
                      <div className="flex h-1.5 w-full rounded-full bg-[#111C38] overflow-hidden">
                        <div className="bg-[#48CAE4]" style={{ width: `${homePct}%` }} />
                        <div className="bg-amber-400" style={{ width: `${100 - homePct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
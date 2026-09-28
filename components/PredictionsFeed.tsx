'use client';

import React, { useState, useEffect } from 'react';
import DateSelectorBar from './DateSelectorBar';
import PredictionCard from './PredictionCard';
import StatsSummary from './StatsSummary';
import { Prediction, UserProfile } from '@/lib/types';
import { Sparkles, RefreshCw } from 'lucide-react';

interface PredictionsFeedProps {
  initialDate: string;
  yesterdayStr: string;
  todayStr: string;
  tomorrowStr: string;
  userProfile?: UserProfile | null;
}

export default function PredictionsFeed({
  initialDate,
  yesterdayStr,
  todayStr,
  tomorrowStr,
  userProfile,
}: PredictionsFeedProps) {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [tierFilter, setTierFilter] = useState<'all' | 'free' | 'vip'>('all');
  const [leagueFilter, setLeagueFilter] = useState<string>('all');

  const isVip = userProfile?.role === 'vip_user' || userProfile?.role === 'admin';

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/predictions?date=${selectedDate}&status=approved`);
        const json = await res.json();
        if (isMounted && json.success) {
          setPredictions(json.data);
        }
      } catch (err) {
        console.error('Failed to load predictions:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [selectedDate]);

  const leagues = Array.from(
    new Set(predictions.map((p) => p.league).filter(Boolean))
  ) as string[];

  const filtered = predictions.filter((p) => {
    if (tierFilter !== 'all' && p.tier !== tierFilter) return false;
    if (leagueFilter !== 'all' && p.league !== leagueFilter) return false;
    return true;
  });

  const dateLabel =
    selectedDate === yesterdayStr ? 'yesterday' : selectedDate === todayStr ? 'today' : selectedDate === tomorrowStr ? 'tomorrow' : selectedDate;

  return (
    <div className="w-full space-y-5">
      <DateSelectorBar
        selectedDate={selectedDate}
        onSelectDate={(newDate) => {
          setSelectedDate(newDate);
          setLeagueFilter('all');
        }}
        yesterdayStr={yesterdayStr}
        todayStr={todayStr}
        tomorrowStr={tomorrowStr}
        predictionsCount={filtered.length}
      />

      <StatsSummary predictions={filtered} dateLabel={dateLabel} />

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl bg-[#111C38] p-3 border border-[#1C2541]">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1 bg-[#0B132B] p-1 rounded-xl border border-[#223156]">
            <button
              onClick={() => setTierFilter('all')}
              className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                tierFilter === 'all' ? 'bg-[#48CAE4] text-[#0B132B] font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Tips
            </button>
            <button
              onClick={() => setTierFilter('free')}
              className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                tierFilter === 'free' ? 'bg-[#48CAE4] text-[#0B132B] font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Free
            </button>
            <button
              onClick={() => setTierFilter('vip')}
              className={`flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-semibold ${
                tierFilter === 'vip' ? 'bg-linear-to-r from-amber-500 to-yellow-500 text-[#0B132B] font-bold' : 'text-amber-400'
              }`}
            >
              <Sparkles className="h-3 w-3" /> VIP
            </button>
          </div>

          {leagues.length > 0 && (
            <select
              value={leagueFilter}
              onChange={(e) => setLeagueFilter(e.target.value)}
              className="rounded-xl border border-[#223156] bg-[#0B132B] px-3 py-1.5 text-xs text-slate-300 focus:border-[#48CAE4] focus:outline-none"
            >
              <option value="all">All Leagues ({leagues.length})</option>
              {leagues.map((lg) => (
                <option key={lg} value={lg}>{lg}</option>
              ))}
            </select>
          )}
        </div>

        <div className="text-xs text-slate-400 font-medium">
          Access: <span className={isVip ? 'text-amber-400 font-bold' : 'text-slate-300'}>{isVip ? 'VIP Member' : 'Free Tier'}</span>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <RefreshCw className="h-7 w-7 animate-spin mx-auto text-[#48CAE4] mb-2" />
          <p className="text-xs text-slate-400">Fetching live database predictions for {selectedDate}...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#1C2541] bg-[#111C38]/50 p-12 text-center">
          <p className="text-sm font-bold text-white">No Approved Predictions Staged for {selectedDate}</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Matches for this date may still be undergoing AI calculation or administrative moderation.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((p) => (
            <PredictionCard
              key={p.id}
              prediction={p}
              isVipMember={isVip}
            />
          ))}
        </div>
      )}
    </div>
  );
}

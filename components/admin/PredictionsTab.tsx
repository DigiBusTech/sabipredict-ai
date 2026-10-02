'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  RefreshCw, Sparkles, Plus, Trash2, CheckSquare, Square, Crown, Check, XCircle,
  AlertTriangle, CheckCircle2, Calendar, Trophy, Search, ChevronDown, Filter, X
} from 'lucide-react';
import { Prediction, LeagueOption, DataProviderType } from '@/lib/types';
import { 
  approvePredictionAction, rejectPredictionAction, settlePredictionAction, 
  deletePredictionAction, bulkApprovePredictionsAction, bulkRejectPredictionsAction, 
  bulkDeletePredictionsAction, triggerSyncFixturesAction,
  triggerGenerateAITipsAction, createManualPredictionAction, fetchAvailableLeaguesAction 
} from '@/app/actions/predictions';
import PredictionRow from './PredictionRow';
import SportsTelemetryPreloader from '@/components/ui/SportsTelemetryPreloader';

interface PredictionsTabProps {
  predictions: Prediction[];
  initialLeagues?: LeagueOption[];
  initialProvider?: DataProviderType;
}

export default function PredictionsTab({
  predictions,
  initialLeagues = [],
  initialProvider = 'sportsmonks',
}: PredictionsTabProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [scoreInputs, setScoreInputs] = useState<Record<string, { home: string; away: string }>>({});
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [settlementFilter, setSettlementFilter] = useState<'all' | 'settled' | 'not_settled'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Date Range state: defaults to Today through Next 3 Days
  const todayStr = new Date().toISOString().split('T')[0];
  const defaultToDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  })();

  const [dateFrom, setDateFrom] = useState(todayStr);
  const [dateTo, setDateTo] = useState(defaultToDate);

  // Leagues state
  const [leagues, setLeagues] = useState<LeagueOption[]>(initialLeagues);
  const [provider, setProvider] = useState<DataProviderType>(initialProvider);
  const [selectedLeagues, setSelectedLeagues] = useState<string[]>(
    initialLeagues.map((l) => l.id)
  );
  const [leagueSearch, setLeagueSearch] = useState('');
  const [isLeagueOpen, setIsLeagueOpen] = useState(false);
  const [loadingLeagues, setLoadingLeagues] = useState(false);

  const leaguePopoverRef = useRef<HTMLDivElement>(null);

  // Close league popover on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (leaguePopoverRef.current && !leaguePopoverRef.current.contains(event.target as Node)) {
        setIsLeagueOpen(false);
      }
    }
    if (isLeagueOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLeagueOpen]);

  // Fetch leagues dynamically if not passed or when refreshed
  const loadLeagues = async () => {
    setLoadingLeagues(true);
    try {
      const res = await fetchAvailableLeaguesAction();
      setLeagues(res.leagues);
      setProvider(res.activeProvider);
      setSelectedLeagues(res.leagues.map((l) => l.id));
    } catch (err: any) {
      console.error('Error fetching available leagues:', err);
    } finally {
      setLoadingLeagues(false);
    }
  };

  useEffect(() => {
    if (!initialLeagues || initialLeagues.length === 0) {
      loadLeagues();
    }
  }, [initialLeagues]);

  const filteredLeagues = leagues.filter(
    (l) =>
      l.name.toLowerCase().includes(leagueSearch.toLowerCase()) ||
      l.country.toLowerCase().includes(leagueSearch.toLowerCase()) ||
      (l.sport_key && l.sport_key.toLowerCase().includes(leagueSearch.toLowerCase()))
  );

  const handleSelectAllLeagues = () => {
    setSelectedLeagues(leagues.map((l) => l.id));
  };

  const handleClearAllLeagues = () => {
    setSelectedLeagues([]);
  };

  const handleToggleLeague = (id: string) => {
    setSelectedLeagues((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filtered = predictions.filter((p) => {
    // 1. Moderation Status Filter
    if (statusFilter !== 'all' && p.status !== statusFilter) {
      return false;
    }

    // 2. Settlement Status Filter
    const isSettled =
      p.prediction_outcome === 'Won' ||
      p.prediction_outcome === 'Lost' ||
      p.prediction_outcome === 'Void';

    if (settlementFilter === 'settled' && !isSettled) {
      return false;
    }
    if (settlementFilter === 'not_settled' && isSettled) {
      return false;
    }

    return true;
  });
  const allFilteredSelected = filtered.length > 0 && filtered.every((p) => selectedIds.includes(p.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) setSelectedIds([]);
    else setSelectedIds(filtered.map((p) => p.id));
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const handleAction = async (id: string, actionFn: () => Promise<any>, actionName: string) => {
    setLoadingAction(id);
    try {
      const res = await actionFn();
      if (res?.success === false || res?.error) {
        setMsg({ type: 'error', text: res?.message || res?.error || `${actionName} failed.` });
      } else {
        setMsg({ type: 'success', text: res?.message || `${actionName} completed.` });
      }
      setTimeout(() => setMsg(null), 6000);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || `${actionName} encountered an unexpected error.` });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleBulkAction = async (actionFn: () => Promise<any>, actionName: string) => {
    if (!selectedIds.length) return;
    setLoadingAction('bulk');
    try {
      const res = await actionFn();
      if (res?.success === false || res?.error) {
        setMsg({ type: 'error', text: res?.message || res?.error || `${actionName} failed.` });
      } else {
        setMsg({ type: 'success', text: res?.message || `${actionName} applied.` });
        setSelectedIds([]);
      }
      setTimeout(() => setMsg(null), 6000);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || `${actionName} failed.` });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSyncWithFilters = () => {
    if (selectedLeagues.length === 0) {
      setMsg({ type: 'error', text: 'Please select at least one league to synchronize fixtures.' });
      setTimeout(() => setMsg(null), 4000);
      return;
    }
    handleAction(
      'sync',
      () =>
        triggerSyncFixturesAction({
          selected_leagues: selectedLeagues,
          date_from: dateFrom,
          date_to: dateTo,
        }),
      'Sync Fixtures'
    );
  };

  const handleGenerateAiWithFilters = () => {
    if (selectedLeagues.length === 0) {
      setMsg({ type: 'error', text: 'Please select at least one league to generate AI predictions.' });
      setTimeout(() => setMsg(null), 4000);
      return;
    }
    handleAction(
      'ai',
      () =>
        triggerGenerateAITipsAction({
          selected_leagues: selectedLeagues,
          date_from: dateFrom,
          date_to: dateTo,
        }),
      'AI Model Generation'
    );
  };

  const isAllLeaguesSelected = leagues.length > 0 && selectedLeagues.length === leagues.length;

  return (
    <div className="space-y-6">
      {/* Moderation Controls Header & Dynamic Sync Controls */}
      <div className="rounded-2xl bg-[#111C38] p-5 border border-[#1C2541] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1C2541] pb-3">
          <div>
            <h2 className="text-base font-black text-white">Live Predictions Moderation</h2>
            <p className="text-xs text-slate-400">
              Select specific leagues and date boundaries, ingest fixtures, calculate AI probabilities, and moderate.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-xl bg-[#0B132B] border border-[#223156] text-[#48CAE4]">
              Active Provider: <strong>{provider === 'the-odds-api' ? 'The Odds API (v4)' : 'Sportsmonks v3'}</strong>
            </span>
          </div>
        </div>

        {/* Dynamic Controls Bar: League Multi-Select & Date Range Picker */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* League Multi-Select Popover */}
            <div ref={leaguePopoverRef} className="relative">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Target Leagues
              </label>
              <button
                type="button"
                onClick={() => setIsLeagueOpen(!isLeagueOpen)}
                className="flex items-center gap-2 rounded-xl border border-[#223156] bg-[#0B132B] px-3.5 py-2 text-xs font-semibold text-white hover:border-[#48CAE4] transition"
              >
                <Trophy className="h-4 w-4 text-[#48CAE4]" />
                <span>
                  {isAllLeaguesSelected || selectedLeagues.length === 0
                    ? `All Leagues (${leagues.length})`
                    : `${selectedLeagues.length} of ${leagues.length} Leagues`}
                </span>
                <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${isLeagueOpen ? 'rotate-180' : ''}`} />
              </button>

              {isLeagueOpen && (
                <div className="absolute left-0 top-full mt-2 z-50 w-72 sm:w-80 rounded-2xl border border-[#223156] bg-[#0B132B] p-3 shadow-2xl backdrop-blur-xl animate-in fade-in duration-150 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-[#1C2541] pb-2">
                    <span className="text-xs font-bold text-white">Select Leagues ({provider})</span>
                    <button
                      type="button"
                      onClick={() => setIsLeagueOpen(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* League Search */}
                  <div className="relative">
                    <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={leagueSearch}
                      onChange={(e) => setLeagueSearch(e.target.value)}
                      placeholder="Search leagues or country..."
                      className="w-full rounded-xl bg-[#111C38] border border-[#223156] pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#48CAE4]"
                    />
                  </div>

                  {/* Select All / Clear All Buttons */}
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={handleSelectAllLeagues}
                      className="text-[11px] font-bold text-[#48CAE4] hover:underline"
                    >
                      Select All ({leagues.length})
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAllLeagues}
                      className="text-[11px] font-bold text-slate-400 hover:text-rose-400 hover:underline"
                    >
                      Clear All
                    </button>
                  </div>

                  {/* Scrollable League Checkboxes List */}
                  <div className="max-h-56 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                    {filteredLeagues.length === 0 ? (
                      <p className="text-[11px] text-slate-400 text-center py-4">No matching leagues found.</p>
                    ) : (
                      filteredLeagues.map((l) => {
                        const isChecked = selectedLeagues.includes(l.id);
                        return (
                          <label
                            key={l.id}
                            className={`flex items-center justify-between p-2 rounded-xl cursor-pointer text-xs transition ${
                              isChecked ? 'bg-[#111C38] text-white' : 'text-slate-300 hover:bg-[#111C38]/60'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleLeague(l.id)}
                                className="rounded border-[#3A506B] bg-[#0B132B] text-[#48CAE4] focus:ring-0"
                              />
                              <span className="font-medium truncate max-w-37.5">{l.name}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 bg-[#0B132B] px-1.5 py-0.5 rounded border border-[#223156]">
                              {l.country}
                            </span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Date Range Controls */}
            <div className="flex items-center gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Start Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="rounded-xl border border-[#223156] bg-[#0B132B] px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-[#48CAE4]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  End Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="rounded-xl border border-[#223156] bg-[#0B132B] px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-[#48CAE4]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Execution Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-4 sm:pt-0">
            <button
              disabled={!!loadingAction}
              onClick={handleSyncWithFilters}
              title={`Sync fixtures from ${dateFrom} to ${dateTo}`}
              className="flex items-center gap-1.5 rounded-xl border border-[#223156] bg-[#0B132B] px-3.5 py-2 text-xs font-semibold hover:border-[#48CAE4] disabled:opacity-50 text-slate-200 transition"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-[#48CAE4] ${loadingAction === 'sync' ? 'animate-spin' : ''}`} />
              <span>Sync Fixtures</span>
            </button>

            <button
              disabled={!!loadingAction}
              onClick={handleGenerateAiWithFilters}
              title={`Generate AI predictions from ${dateFrom} to ${dateTo}`}
              className="flex items-center gap-1.5 rounded-xl bg-[#48CAE4] px-4 py-2 text-xs font-black text-[#0B132B] hover:bg-[#00B4D8] disabled:opacity-50 transition shadow-md"
            >
              <Sparkles className={`h-3.5 w-3.5 ${loadingAction === 'ai' ? 'animate-bounce' : ''}`} />
              <span>Generate AI Tips</span>
            </button>

            <button
              onClick={() => setShowManualForm(!showManualForm)}
              className="flex items-center gap-1.5 rounded-xl border border-[#3A506B] bg-[#1C2541] px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Manual Tip</span>
            </button>
          </div>
        </div>
      </div>

      {loadingAction && (
        <SportsTelemetryPreloader
          variant="compact"
          message={
            loadingAction === 'sync'
              ? 'Ingesting Live Sports Fixtures & Telemetry...'
              : loadingAction === 'ai'
              ? 'Computing Poisson Goal Matrices & Confidence Scores...'
              : 'Processing Quantitative Sports Telemetry...'
          }
        />
      )}

      {msg && (
        <div
          className={`rounded-2xl border p-4 text-xs font-semibold flex items-center justify-between gap-3 shadow-lg animate-in fade-in duration-200 ${
            msg.type === 'error'
              ? 'border-rose-500/50 bg-rose-500/15 text-rose-200'
              : 'border-[#48CAE4]/50 bg-[#48CAE4]/10 text-[#48CAE4]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {msg.type === 'error' ? (
              <XCircle className="h-5 w-5 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-[#48CAE4] shrink-0" />
            )}
            <span className="leading-relaxed">{msg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setMsg(null)}
            className="text-slate-400 hover:text-white text-xs underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Manual Tip Creation Form */}
      {showManualForm && (
        <form
          action={async (formData: FormData) => {
            const res = await createManualPredictionAction(formData);
            if (res.error) setMsg({ type: 'error', text: res.error });
            else {
              setMsg({ type: 'success', text: 'Manual tip created successfully.' });
              setShowManualForm(false);
            }
          }}
          className="rounded-2xl border border-[#223156] bg-[#111C38] p-4 text-xs space-y-3"
        >
          <div className="font-bold text-white text-sm">Create Manual Prediction</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <input name="home_team" placeholder="Home Team" required className="rounded-xl bg-[#0B132B] border border-[#223156] px-3 py-2 text-white" />
            <input name="away_team" placeholder="Away Team" required className="rounded-xl bg-[#0B132B] border border-[#223156] px-3 py-2 text-white" />
            <input name="league" placeholder="League" required className="rounded-xl bg-[#0B132B] border border-[#223156] px-3 py-2 text-white" />
            <input name="match_date" type="date" defaultValue={dateFrom} required className="rounded-xl bg-[#0B132B] border border-[#223156] px-3 py-2 text-white" />
            <input name="market" placeholder="Market (e.g. Over 1.5 Goals)" required className="rounded-xl bg-[#0B132B] border border-[#223156] px-3 py-2 text-white" />
            <input name="odds" type="number" step="0.01" placeholder="Odds (1.45)" required className="rounded-xl bg-[#0B132B] border border-[#223156] px-3 py-2 text-white" />
            <input name="confidence_score" type="number" placeholder="Confidence %" defaultValue="82" className="rounded-xl bg-[#0B132B] border border-[#223156] px-3 py-2 text-white" />
            <select name="tier" className="rounded-xl bg-[#0B132B] border border-[#223156] px-3 py-2 text-white">
              <option value="free">Free Tier</option>
              <option value="vip">VIP Lounge</option>
            </select>
          </div>
          <textarea name="ai_analysis" placeholder="Tactical quantitative rationale..." rows={2} className="w-full rounded-xl bg-[#0B132B] border border-[#223156] p-2.5 text-white" />
          <details className="rounded-xl border border-[#223156] bg-[#0B132B]/60 p-3">
            <summary className="cursor-pointer text-xs font-bold text-[#48CAE4]">Optional French, Spanish, and Portuguese prediction text</summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {(['fr', 'es', 'pt'] as const).map((locale) => (
                <fieldset key={locale} className="space-y-2">
                  <legend className="text-[10px] font-black uppercase text-slate-300">{locale}</legend>
                  <input name={`${locale}_league`} placeholder="League" className="w-full rounded-lg border border-[#223156] bg-[#111C38] px-2 py-1.5 text-xs text-white" />
                  <input name={`${locale}_market`} placeholder="Market" className="w-full rounded-lg border border-[#223156] bg-[#111C38] px-2 py-1.5 text-xs text-white" />
                  <textarea name={`${locale}_analysis`} rows={3} placeholder="Analysis" className="w-full rounded-lg border border-[#223156] bg-[#111C38] p-2 text-xs text-white" />
                </fieldset>
              ))}
            </div>
          </details>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowManualForm(false)} className="px-3 py-1 text-slate-400">Cancel</button>
            <button type="submit" className="rounded-xl bg-[#48CAE4] px-4 py-1.5 font-bold text-[#0B132B]">Save</button>
          </div>
        </form>
      )}

      {/* Filter and Bulk Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#111C38] p-3 rounded-2xl border border-[#1C2541]">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#223156] text-xs font-medium text-slate-300 hover:text-white transition cursor-pointer"
          >
            {allFilteredSelected ? (
              <CheckSquare className="h-4 w-4 text-[#48CAE4]" />
            ) : (
              <Square className="h-4 w-4 text-slate-400" />
            )}
            <span>Select All ({filtered.length})</span>
          </button>

          {/* Moderation Status Filter */}
          <div className="flex items-center gap-1 rounded-xl bg-[#0B132B] p-1 border border-[#223156]">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${
                  statusFilter === filter
                    ? 'bg-[#48CAE4] text-[#0B132B]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Settlement Outcome Filter */}
          <div className="flex items-center gap-1 rounded-xl bg-[#0B132B] p-1 border border-[#223156]">
            {([
              { id: 'all', label: 'All' },
              { id: 'not_settled', label: 'Not Settled' },
              { id: 'settled', label: 'Settled' },
            ] as const).map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setSettlementFilter(id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${
                  settlementFilter === id
                    ? 'bg-[#48CAE4] text-[#0B132B]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 animate-in fade-in duration-200">
            <span className="text-xs font-bold text-[#48CAE4] px-2">{selectedIds.length} Selected:</span>
            <button disabled={loadingAction === 'bulk'} onClick={() => handleBulkAction(() => bulkApprovePredictionsAction(selectedIds, 'free'), 'Approve Free')} className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold hover:bg-emerald-500/30 cursor-pointer">
              <Check className="h-3.5 w-3.5" /> Approve Free
            </button>
            <button disabled={loadingAction === 'bulk'} onClick={() => handleBulkAction(() => bulkApprovePredictionsAction(selectedIds, 'vip'), 'Approve VIP')} className="flex items-center gap-1 px-3 py-1 rounded-lg bg-linear-to-r from-amber-500 to-yellow-500 text-[#0B132B] text-xs font-black cursor-pointer">
              <Crown className="h-3.5 w-3.5" /> Approve VIP
            </button>
            <button disabled={loadingAction === 'bulk'} onClick={() => handleBulkAction(() => bulkRejectPredictionsAction(selectedIds), 'Reject')} className="flex items-center gap-1 px-3 py-1 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold hover:bg-rose-500/30 cursor-pointer">
              <XCircle className="h-3.5 w-3.5" /> Reject
            </button>
            <button disabled={loadingAction === 'bulk'} onClick={() => handleBulkAction(() => bulkDeletePredictionsAction(selectedIds), 'Delete')} className="flex items-center gap-1 px-3 py-1 rounded-lg bg-red-950/40 text-red-400 border border-red-800/40 text-xs font-bold hover:bg-red-900/60 cursor-pointer">
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        )}
      </div>

      {/* Predictions Rows */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#223156] bg-[#111C38]/40 p-8 text-center text-sm text-slate-400">
            No predictions found matching &quot;{statusFilter}&quot; status and &quot;{settlementFilter === 'all' ? 'all outcomes' : settlementFilter === 'settled' ? 'settled' : 'not settled'}&quot;.
          </div>
        ) : (
          filtered.map((p) => (
            <PredictionRow
              key={p.id}
              prediction={p}
              isSelected={selectedIds.includes(p.id)}
              onToggleSelect={toggleSelectOne}
              scores={scoreInputs[p.id] || {
                home: p.home_score !== null && p.home_score !== undefined ? String(p.home_score) : '',
                away: p.away_score !== null && p.away_score !== undefined ? String(p.away_score) : '',
              }}
              onScoreChange={(home, away) => setScoreInputs({ ...scoreInputs, [p.id]: { home, away } })}
              onSettle={(outcome) => {
                const s = scoreInputs[p.id] || { home: '0', away: '0' };
                handleAction(p.id, () => settlePredictionAction(p.id, parseInt(s.home || '0', 10), parseInt(s.away || '0', 10), outcome), `Settled as ${outcome}`);
              }}
              onApprove={(tier) => handleAction(p.id, () => approvePredictionAction(p.id, tier), `Approved ${tier}`)}
              onReject={() => handleAction(p.id, () => rejectPredictionAction(p.id), 'Rejected')}
              onDelete={() => handleAction(p.id, () => deletePredictionAction(p.id), 'Deleted')}
            />
          ))
        )}
      </div>
    </div>
  );
}
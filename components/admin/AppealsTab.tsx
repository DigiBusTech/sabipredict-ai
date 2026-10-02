'use client';

import React, { useState } from 'react';
import { CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import { reviewAccountAppealAction } from '@/app/actions/growth';
import { AccountAppeal } from '@/lib/types';

export default function AppealsTab({ initialItems }: { initialItems: AccountAppeal[] }) {
  const [items, setItems] = useState(initialItems);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const visibleItems = items.filter((item) => filter === 'all' || item.status === 'pending');

  async function review(item: AccountAppeal, status: 'reinstated' | 'rejected') {
    const response = responses[item.id] || '';
    setBusyId(item.id);
    const result = await reviewAccountAppealAction({ id: item.id, status, response });
    setBusyId(null);
    if (!result.success) {
      setNotice(result.error || 'Appeal could not be updated.');
      return;
    }
    setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, status, admin_response: response, reviewed_at: new Date().toISOString() } : entry));
    setNotice(status === 'reinstated' ? 'Account reinstated.' : 'Appeal rejected.');
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1C2541] pb-3">
        <div className="flex gap-1 rounded-lg border border-[#1C2541] bg-[#111C38] p-1">
          <button type="button" onClick={() => setFilter('pending')} className={`rounded-md px-3 py-1.5 text-[11px] font-bold ${filter === 'pending' ? 'bg-[#48CAE4] text-[#0B132B]' : 'text-slate-400'}`}>Pending ({items.filter((item) => item.status === 'pending').length})</button>
          <button type="button" onClick={() => setFilter('all')} className={`rounded-md px-3 py-1.5 text-[11px] font-bold ${filter === 'all' ? 'bg-[#48CAE4] text-[#0B132B]' : 'text-slate-400'}`}>All ({items.length})</button>
        </div>
        {notice && <p role="status" className="text-xs text-emerald-300">{notice}</p>}
      </div>

      {visibleItems.length === 0 ? <p className="rounded-xl border border-dashed border-[#33415F] px-4 py-10 text-center text-xs text-slate-400">No appeals to review.</p> : (
        <div className="space-y-3">
          {visibleItems.map((item) => (
            <article key={item.id} className="space-y-3 rounded-xl border border-[#25314D] bg-[#111C38] p-4">
              <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-xs font-black text-white">{item.user_name || 'Member'} · {item.user_email}</p><p className="text-[10px] text-slate-500">{new Date(item.created_at).toLocaleString()}</p></div><span className="rounded-full bg-[#0B132B] px-2 py-1 text-[9px] font-black uppercase text-amber-300">{item.status}</span></div>
              <p className="whitespace-pre-wrap rounded-lg border border-[#25314D] bg-[#0B132B] p-3 text-xs leading-relaxed text-slate-200">{item.message}</p>
              {item.admin_response && <p className="text-[11px] text-slate-400">Response: {item.admin_response}</p>}
              {item.status === 'pending' && <>
                <textarea value={responses[item.id] || ''} onChange={(event) => setResponses((current) => ({ ...current, [item.id]: event.target.value }))} maxLength={1500} rows={2} placeholder="Optional response to the user" className="w-full rounded-lg border border-[#34415E] bg-[#0B132B] p-3 text-xs text-white outline-none focus:border-[#48CAE4]" />
                <div className="flex flex-wrap gap-2 border-t border-[#25314D] pt-3">
                  <button type="button" disabled={busyId === item.id} onClick={() => void review(item, 'reinstated')} className="inline-flex min-h-8 items-center gap-1 rounded-lg bg-emerald-400 px-3 text-[10px] font-black text-[#08251D] disabled:opacity-50"><CheckCircle2 className="h-3 w-3" /> Reinstate account</button>
                  <button type="button" disabled={busyId === item.id} onClick={() => void review(item, 'rejected')} className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-rose-400/30 px-3 text-[10px] font-bold text-rose-300 disabled:opacity-50"><XCircle className="h-3 w-3" /> Reject appeal</button>
                  <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-slate-500"><RotateCcw className="h-3 w-3" /> Access changes only on reinstatement</span>
                </div>
              </>}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
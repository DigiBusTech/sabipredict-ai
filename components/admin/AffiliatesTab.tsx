'use client';

import React, { useState } from 'react';
import { Check, RefreshCw, X } from 'lucide-react';
import { resolveAffiliatePayoutAction, saveAffiliateSettingsAction } from '@/app/actions/growth';
import { AffiliatePayoutRequest, AffiliateSettings } from '@/lib/types';

export default function AffiliatesTab({
  initialSettings,
  initialPayouts,
}: {
  initialSettings: AffiliateSettings;
  initialPayouts: AffiliatePayoutRequest[];
}) {
  const [payouts, setPayouts] = useState(initialPayouts);
  const [commission, setCommission] = useState(String(initialSettings.commission_percent));
  const [minimum, setMinimum] = useState(String(initialSettings.minimum_payout));
  const [note, setNote] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [activePayout, setActivePayout] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function saveSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const result = await saveAffiliateSettingsAction({ commission_percent: Number(commission), minimum_payout: Number(minimum) });
    setBusy(false);
    if (!result.success) {
      setNotice(result.error || 'Settings could not be saved.');
      return;
    }
    setNotice('Affiliate settings saved.');
  }

  async function resolvePayout(payout: AffiliatePayoutRequest, status: 'approved' | 'rejected' | 'paid') {
    setBusy(true);
    const result = await resolveAffiliatePayoutAction({ id: payout.id, status, note, paymentReference });
    setBusy(false);
    if (!result.success) {
      setNotice(result.error || 'Payout could not be updated.');
      return;
    }
    setPayouts((items) => items.map((item) => item.id === payout.id ? { ...item, status, admin_note: note || null, payment_reference: paymentReference || null } : item));
    setActivePayout(null);
    setNote('');
    setPaymentReference('');
    setNotice(`Payout marked ${status}.`);
  }

  return (
    <div className="space-y-6">
      <form onSubmit={saveSettings} className="grid gap-4 rounded-xl border border-[#25314D] bg-[#111C38] p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div><label htmlFor="affiliate-commission" className="text-xs font-bold text-slate-300">Commission percent (0–20%)</label><input id="affiliate-commission" required type="number" min="0" max="20" step="0.25" value={commission} onChange={(event) => setCommission(event.target.value)} className="mt-1.5 min-h-10 w-full rounded-lg border border-[#34415E] bg-[#0B132B] px-3 text-sm text-white" /></div>
        <div><label htmlFor="affiliate-minimum" className="text-xs font-bold text-slate-300">Minimum payout</label><input id="affiliate-minimum" required type="number" min="0" max="100000" step="0.01" value={minimum} onChange={(event) => setMinimum(event.target.value)} className="mt-1.5 min-h-10 w-full rounded-lg border border-[#34415E] bg-[#0B132B] px-3 text-sm text-white" /></div>
        <button type="submit" disabled={busy} className="min-h-10 rounded-lg bg-[#48CAE4] px-4 text-xs font-black text-[#0B132B] disabled:opacity-50">Save settings</button>
        <p className="text-[11px] leading-relaxed text-slate-400 sm:col-span-3">These settings apply to future verified subscriptions. Existing commission ledger entries remain unchanged. Welcome bonuses and referral-count thresholds are not used.</p>
      </form>

      {notice && <p role="status" className="text-xs text-emerald-300">{notice}</p>}

      <section className="space-y-3">
        <div><h2 className="text-sm font-black text-white">Payout review queue</h2><p className="mt-1 text-xs text-slate-400">Approve or reject requests; mark an approved request paid only after completing the transfer.</p></div>
        {payouts.length === 0 ? <p className="rounded-xl border border-dashed border-[#33415F] px-4 py-10 text-center text-xs text-slate-400">No payout requests.</p> : (
          <div className="space-y-3">
            {payouts.map((payout) => (
              <article key={payout.id} className="space-y-3 rounded-xl border border-[#25314D] bg-[#111C38] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><p className="text-sm font-black text-white">${Number(payout.amount).toFixed(2)} · {payout.payout_method}</p><p className="mt-1 text-xs text-slate-300">{payout.user_name || 'Member'} · {payout.user_email}</p><p className="mt-1 text-[10px] text-slate-500">Requested {new Date(payout.requested_at).toLocaleString()}</p></div>
                  <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-1 text-[9px] font-black uppercase text-amber-300">{payout.status}</span>
                </div>
                <div className="rounded-lg border border-[#25314D] bg-[#0B132B] p-3"><p className="text-[10px] font-bold uppercase text-slate-500">Payout details</p><p className="mt-1 whitespace-pre-wrap break-all text-xs text-slate-200">{payout.payout_details}</p></div>
                {payout.admin_note && <p className="text-[11px] text-slate-400">Admin note: {payout.admin_note}</p>}
                {payout.payment_reference && <p className="text-[11px] text-slate-400">Payment reference: {payout.payment_reference}</p>}
                {payout.status === 'pending' && activePayout === payout.id && <div className="grid gap-2 sm:grid-cols-2"><input value={note} onChange={(event) => setNote(event.target.value)} maxLength={1000} placeholder="Optional note" className="min-h-9 rounded-lg border border-[#34415E] bg-[#0B132B] px-3 text-xs text-white" /><input value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} maxLength={120} placeholder="Transfer reference (optional before approval)" className="min-h-9 rounded-lg border border-[#34415E] bg-[#0B132B] px-3 text-xs text-white" /></div>}
                <div className="flex flex-wrap gap-2 border-t border-[#25314D] pt-3">
                  {payout.status === 'pending' && <>{activePayout !== payout.id ? <button type="button" onClick={() => setActivePayout(payout.id)} className="min-h-8 rounded-lg bg-emerald-400 px-3 text-[10px] font-black text-[#08251D]">Review</button> : <><button type="button" disabled={busy} onClick={() => void resolvePayout(payout, 'approved')} className="inline-flex min-h-8 items-center gap-1 rounded-lg bg-emerald-400 px-3 text-[10px] font-black text-[#08251D] disabled:opacity-50"><Check className="h-3 w-3" /> Approve</button><button type="button" disabled={busy} onClick={() => void resolvePayout(payout, 'rejected')} className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-rose-400/30 px-3 text-[10px] font-bold text-rose-300 disabled:opacity-50"><X className="h-3 w-3" /> Reject</button><button type="button" onClick={() => setActivePayout(null)} className="min-h-8 rounded-lg border border-[#34415E] px-3 text-[10px] text-slate-300">Cancel</button></>}</>}
                  {payout.status === 'approved' && <button type="button" disabled={busy} onClick={() => { setActivePayout(payout.id); if (!paymentReference) setPaymentReference(''); }} className="inline-flex min-h-8 items-center gap-1 rounded-lg bg-[#48CAE4] px-3 text-[10px] font-black text-[#0B132B] disabled:opacity-50"><RefreshCw className="h-3 w-3" /> Mark paid</button>}
                  {payout.status === 'approved' && activePayout === payout.id && <><input autoFocus value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} required maxLength={120} placeholder="Transfer reference" className="min-h-8 rounded-lg border border-[#34415E] bg-[#0B132B] px-3 text-xs text-white" /><button type="button" disabled={busy || !paymentReference.trim()} onClick={() => void resolvePayout(payout, 'paid')} className="min-h-8 rounded-lg bg-emerald-400 px-3 text-[10px] font-black text-[#08251D] disabled:opacity-50">Confirm paid</button></>}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
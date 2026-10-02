'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Check, Copy, ExternalLink, Link2, Send, Wallet } from 'lucide-react';
import { requestAffiliatePayoutAction } from '@/app/actions/growth';
import { AffiliateDashboardData } from '@/lib/types';

const money = (value: number) => `$${Number(value).toFixed(2)}`;

export default function AffiliateDashboard({ data }: { data: AffiliateDashboardData }) {
  const [copied, setCopied] = useState(false);
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'bank' | 'crypto'>('bank');
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ error: boolean; text: string } | null>(null);

  const referralPath = `/signup?ref=${data.referral_code}`;
  const paidReferrals = data.referrals.filter((referral) => referral.subscription_status === 'active').length;

  async function copyReferralLink() {
    await navigator.clipboard.writeText(new URL(referralPath, window.location.origin).toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function openShare(platform: 'whatsapp' | 'telegram' | 'x') {
    const referralLink = new URL(referralPath, window.location.origin).toString();
    const shareText = 'Explore SabiPredict AI memberships';
    const url = platform === 'whatsapp'
      ? `https://wa.me/?text=${encodeURIComponent(`${shareText}: ${referralLink}`)}`
      : platform === 'telegram'
        ? `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareText)}`
        : `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(referralLink)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  async function submitPayout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice(null);
    const result = await requestAffiliatePayoutAction({ amount: Number(amount), method, details });
    setBusy(false);
    if (!result.success) {
      setNotice({ error: true, text: result.error || 'Payout request failed.' });
      return;
    }
    setPayoutOpen(false);
    setNotice({ error: false, text: 'Payout request sent for review.' });
  }

  return (
    <div className="space-y-7">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Affiliate summary">
        {[
          ['Available commissions', money(data.available_balance)],
          ['Commission balance', money(data.balance)],
          ['Lifetime commissions', money(data.lifetime_commissions)],
          ['Paid referrals', String(paidReferrals)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-[#25314D] bg-[#111C38] p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
            <p className="mt-2 text-2xl font-black text-white">{value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4 rounded-xl border border-[#25314D] bg-[#111C38] p-5">
          <div><h2 className="text-sm font-black text-white">Your referral link</h2><p className="mt-1 text-xs text-slate-400">Share SabiPredict AI with someone who may find the membership useful.</p></div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex min-h-10 min-w-0 flex-1 items-center gap-2 rounded-lg border border-[#34415E] bg-[#0B132B] px-3 text-xs text-slate-300"><Link2 className="h-4 w-4 shrink-0 text-[#48CAE4]" /><span className="truncate">{referralPath}</span></div>
            <button type="button" onClick={() => void copyReferralLink()} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#48CAE4] px-4 text-xs font-black text-[#0B132B]">{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? 'Copied' : 'Copy link'}</button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => openShare('whatsapp')} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#34415E] px-3 text-[11px] font-bold text-slate-200 hover:border-emerald-400">WhatsApp <ExternalLink className="h-3 w-3" /></button>
            <button type="button" onClick={() => openShare('telegram')} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#34415E] px-3 text-[11px] font-bold text-slate-200 hover:border-sky-400">Telegram <ExternalLink className="h-3 w-3" /></button>
            <button type="button" onClick={() => openShare('x')} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#34415E] px-3 text-[11px] font-bold text-slate-200 hover:border-white">X <ExternalLink className="h-3 w-3" /></button>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-4 rounded-xl border border-[#25314D] bg-[#111C38] p-5">
          <div>
            <h2 className="text-sm font-black text-white">Commission terms</h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-300">You currently earn {data.settings.commission_percent}% of an eligible referred member’s subscription after payment is verified. Commissions are not guaranteed income; referrals must sign up through your link and complete a qualifying purchase.</p>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-400">Minimum payout: {money(data.settings.minimum_payout)}. Pending requests reserve funds until they are rejected or paid.</p>
            <Link href="/affiliate-policy" className="mt-3 inline-block text-[11px] font-bold text-[#48CAE4] hover:text-white">Read the affiliate policy</Link>
          </div>
          <button type="button" onClick={() => setPayoutOpen(true)} disabled={data.available_balance < data.settings.minimum_payout} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-emerald-400 px-4 text-xs font-black text-[#08251D] disabled:cursor-not-allowed disabled:opacity-40"><Wallet className="h-4 w-4" /> Request payout</button>
        </div>
      </section>

      {notice && <p role="status" className={`rounded-lg border px-3 py-2 text-xs ${notice.error ? 'border-rose-400/30 bg-rose-400/10 text-rose-200' : 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'}`}>{notice.text}</p>}

      <section className="space-y-3">
        <div><h2 className="text-sm font-black text-white">Referral history</h2><p className="mt-1 text-xs text-slate-400">Commissions are posted after verified payments.</p></div>
        <div className="overflow-x-auto rounded-xl border border-[#25314D]">
          <table className="w-full min-w-155 text-left text-xs">
            <thead className="bg-[#111C38] text-[10px] uppercase text-slate-400"><tr><th className="px-4 py-3">Member</th><th className="px-4 py-3">Joined</th><th className="px-4 py-3">Membership</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Commission</th></tr></thead>
            <tbody className="divide-y divide-[#25314D] bg-[#0D172F]">
              {data.referrals.map((referral) => <tr key={referral.id}><td className="px-4 py-3"><span className="block font-bold text-white">{referral.referred_name}</span><span className="text-[10px] text-slate-500">{referral.referred_email}</span></td><td className="px-4 py-3 text-slate-300">{new Date(referral.created_at).toLocaleDateString()}</td><td className="px-4 py-3 text-slate-300">{referral.current_plan_id || 'No active plan'}</td><td className="px-4 py-3"><span className={referral.subscription_status === 'active' ? 'text-emerald-300' : 'text-slate-400'}>{referral.subscription_status}</span></td><td className="px-4 py-3 text-right font-bold text-emerald-300">{money(referral.commission_total)}</td></tr>)}
              {data.referrals.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No referrals yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-black text-white">Payout requests</h2>
        {data.payouts.map((payout) => <div key={payout.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#25314D] bg-[#111C38] px-4 py-3 text-xs"><span className="font-bold text-white">{money(payout.amount)} · {payout.payout_method}</span><span className="text-slate-300">{new Date(payout.requested_at).toLocaleDateString()}</span><span className="font-bold capitalize text-amber-300">{payout.status}</span>{payout.payment_reference && <span className="text-slate-400">Ref: {payout.payment_reference}</span>}</div>)}
        {data.payouts.length === 0 && <p className="rounded-lg border border-dashed border-[#33415F] px-4 py-5 text-center text-xs text-slate-400">No payout requests.</p>}
      </section>

      {payoutOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617]/85 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setPayoutOpen(false); }}>
        <form onSubmit={submitPayout} role="dialog" aria-modal="true" aria-labelledby="payout-title" className="w-full max-w-md space-y-4 rounded-xl border border-[#33415F] bg-[#101A33] p-5 shadow-2xl">
          <div><h3 id="payout-title" className="text-sm font-black text-white">Request a commission payout</h3><p className="mt-1 text-[11px] text-slate-400">Available balance: {money(data.available_balance)}</p></div>
          <label className="block text-xs font-bold text-slate-300">Amount<input required type="number" min={data.settings.minimum_payout} max={data.available_balance} step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} className="mt-1.5 min-h-10 w-full rounded-lg border border-[#34415E] bg-[#0B132B] px-3 text-white outline-none focus:border-[#48CAE4]" /></label>
          <label className="block text-xs font-bold text-slate-300">Method<select value={method} onChange={(event) => setMethod(event.target.value as 'bank' | 'crypto')} className="mt-1.5 min-h-10 w-full rounded-lg border border-[#34415E] bg-[#0B132B] px-3 text-white"><option value="bank">Bank transfer</option><option value="crypto">Crypto (USDT TRC20)</option></select></label>
          <label className="block text-xs font-bold text-slate-300">Payment details<textarea required minLength={5} maxLength={2000} rows={3} value={details} onChange={(event) => setDetails(event.target.value)} placeholder={method === 'bank' ? 'Account name, bank, account number' : 'Wallet address'} className="mt-1.5 w-full rounded-lg border border-[#34415E] bg-[#0B132B] p-3 text-white outline-none focus:border-[#48CAE4]" /></label>
          <p className="text-[10px] leading-relaxed text-slate-400">Payment details are visible to administrators processing this request. Approved requests are marked paid only after transfer is completed.</p>
          <div className="flex justify-end gap-2"><button type="button" onClick={() => setPayoutOpen(false)} className="min-h-9 rounded-lg border border-[#34415E] px-3 text-xs font-bold text-slate-300">Cancel</button><button type="submit" disabled={busy} className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-emerald-400 px-4 text-xs font-black text-[#08251D] disabled:opacity-50"><Send className="h-3.5 w-3.5" />{busy ? 'Sending...' : 'Request payout'}</button></div>
        </form>
      </div>}
    </div>
  );
}
'use client';

import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { submitAccountAppealAction } from '@/app/actions/growth';
import { AccountAppeal, AccountModeration } from '@/lib/types';

export default function AppealForm({ moderation, appeals }: { moderation: AccountModeration | null; appeals: AccountAppeal[] }) {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const hasPending = appeals.some((appeal) => appeal.status === 'pending');

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const result = await submitAccountAppealAction(message);
    setBusy(false);
    if (!result.success) {
      setNotice(result.error || 'Appeal could not be submitted.');
      return;
    }
    setMessage('');
    setNotice('Your appeal has been submitted for review.');
  }

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-rose-400/25 bg-[#111C38] p-5">
        <p className="text-[10px] font-black uppercase tracking-wider text-rose-300">Account status</p>
        <h2 className="mt-1 text-lg font-black capitalize text-white">{moderation?.status || 'restricted'}</h2>
        {moderation?.reason && <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{moderation.reason}</p>}
        <p className="mt-3 text-[11px] text-slate-500">An administrator must review and reinstate restricted accounts. Submitting an appeal does not automatically restore access.</p>
      </section>

      {!hasPending && (
        <form onSubmit={submit} className="space-y-3 rounded-xl border border-[#25314D] bg-[#111C38] p-5">
          <label className="block text-xs font-bold text-slate-300">Explain your appeal
            <textarea required minLength={30} maxLength={3000} rows={6} value={message} onChange={(event) => setMessage(event.target.value)} className="mt-1.5 w-full rounded-lg border border-[#34415E] bg-[#0B132B] p-3 text-sm text-white outline-none focus:border-[#48CAE4]" />
            <span className="mt-1 block text-right text-[10px] font-normal text-slate-500">{message.length}/3000</span>
          </label>
          {notice && <p role="status" className="text-xs text-emerald-300">{notice}</p>}
          <button type="submit" disabled={busy || message.trim().length < 30} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#48CAE4] px-4 text-xs font-black text-[#0B132B] disabled:opacity-50"><Send className="h-3.5 w-3.5" />{busy ? 'Submitting...' : 'Submit appeal'}</button>
        </form>
      )}
      {hasPending && <p className="rounded-lg border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-xs text-amber-200">Your appeal is awaiting review. You can return here to check for a response.</p>}

      <section className="space-y-2">
        <h2 className="text-sm font-black text-white">Appeal history</h2>
        {appeals.map((appeal) => <article key={appeal.id} className="rounded-lg border border-[#25314D] bg-[#111C38] p-4"><div className="flex justify-between gap-3"><span className="text-xs font-bold capitalize text-slate-200">{appeal.status}</span><time className="text-[10px] text-slate-500">{new Date(appeal.created_at).toLocaleDateString()}</time></div><p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-slate-400">{appeal.message}</p>{appeal.admin_response && <p className="mt-3 border-t border-[#25314D] pt-3 text-xs text-[#48CAE4]">Admin response: {appeal.admin_response}</p>}</article>)}
      </section>
    </div>
  );
}
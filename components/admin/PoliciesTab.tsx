'use client';

import React, { useState } from 'react';
import { savePolicyPageAction } from '@/app/actions/growth';
import { PolicyPage } from '@/lib/types';

const policySlugs: PolicyPage['slug'][] = ['terms', 'privacy', 'affiliate-policy'];

export default function PoliciesTab({ initialPages }: { initialPages: PolicyPage[] }) {
  const [pages, setPages] = useState(() => policySlugs.map((slug) => initialPages.find((page) => page.slug === slug) || {
    slug,
    title: slug === 'affiliate-policy' ? 'Affiliate Policy' : slug === 'privacy' ? 'Privacy Policy' : 'Terms and Conditions',
    content: '',
    is_published: true,
    updated_at: new Date(0).toISOString(),
  }));
  const [selectedSlug, setSelectedSlug] = useState<PolicyPage['slug']>('terms');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const selectedPage = pages.find((page) => page.slug === selectedSlug)!;

  function updatePage(patch: Partial<PolicyPage>) {
    setPages((current) => current.map((page) => page.slug === selectedSlug ? { ...page, ...patch } : page));
  }

  async function savePage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const result = await savePolicyPageAction({
      slug: selectedPage.slug,
      title: selectedPage.title,
      content: selectedPage.content,
      is_published: selectedPage.is_published,
    });
    setBusy(false);
    setNotice(result.success ? 'Policy page saved.' : result.error || 'Policy page could not be saved.');
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[190px_1fr]">
      <nav aria-label="Policy pages" className="flex gap-2 overflow-x-auto lg:flex-col">
        {policySlugs.map((slug) => <button key={slug} type="button" onClick={() => setSelectedSlug(slug)} className={`min-h-9 whitespace-nowrap rounded-lg border px-3 text-left text-xs font-bold capitalize ${selectedSlug === slug ? 'border-[#48CAE4] bg-[#48CAE4]/10 text-[#48CAE4]' : 'border-[#25314D] bg-[#111C38] text-slate-300'}`}>{slug.replace('-', ' ')}</button>)}
      </nav>
      <form onSubmit={savePage} className="space-y-4 rounded-xl border border-[#25314D] bg-[#111C38] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-sm font-black text-white">Edit {selectedPage.slug.replace('-', ' ')}</h2><p className="mt-1 text-[10px] text-slate-500">Displayed as plain text with preserved paragraphs.</p></div><label className="inline-flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" checked={selectedPage.is_published} onChange={(event) => updatePage({ is_published: event.target.checked })} className="accent-[#48CAE4]" /> Published</label></div>
        <label className="block text-xs font-bold text-slate-300">Page title<input required minLength={3} maxLength={120} value={selectedPage.title} onChange={(event) => updatePage({ title: event.target.value })} className="mt-1.5 min-h-10 w-full rounded-lg border border-[#34415E] bg-[#0B132B] px-3 text-sm text-white" /></label>
        <label className="block text-xs font-bold text-slate-300">Page content<textarea maxLength={30000} rows={18} value={selectedPage.content} onChange={(event) => updatePage({ content: event.target.value })} placeholder="Write policy content. Include clear commission, payout, renewal, and eligibility terms where applicable." className="mt-1.5 w-full rounded-lg border border-[#34415E] bg-[#0B132B] p-3 text-sm leading-relaxed text-white outline-none focus:border-[#48CAE4]" /><span className="mt-1 block text-right text-[10px] font-normal text-slate-500">{selectedPage.content.length}/30000</span></label>
        <div className="flex flex-wrap items-center justify-between gap-3"><p role="status" className="text-xs text-emerald-300">{notice}</p><button type="submit" disabled={busy} className="min-h-10 rounded-lg bg-[#48CAE4] px-4 text-xs font-black text-[#0B132B] disabled:opacity-50">{busy ? 'Saving...' : 'Save policy'}</button></div>
      </form>
    </div>
  );
}
'use client';

import React, { useState } from 'react';
import { Check, Star, Trash2, X } from 'lucide-react';
import { deleteTestimonialAction, updateTestimonialAction } from '@/app/actions/growth';
import { Testimonial, TestimonialStatus } from '@/lib/types';

export default function TestimonialsTab({ initialItems }: { initialItems: Testimonial[] }) {
  const [items, setItems] = useState(initialItems);
  const [filter, setFilter] = useState<TestimonialStatus | 'all'>('pending');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [translations, setTranslations] = useState<Record<string, NonNullable<Testimonial['translations']>>>({});
  const [notice, setNotice] = useState<string | null>(null);

  const visibleItems = items.filter((item) => filter === 'all' || item.status === filter);

  async function save(item: Testimonial, status: TestimonialStatus, isFeatured: boolean, content: string) {
    const itemTranslations = translations[item.id] || item.translations || {};
    setBusyId(item.id);
    const result = await updateTestimonialAction({ id: item.id, status, is_featured: isFeatured, content, translations: itemTranslations });
    setBusyId(null);
    if (!result.success) {
      setNotice(result.error || 'Review could not be updated.');
      return;
    }
    setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, status, is_featured: result.is_featured || false, content, translations: itemTranslations } : entry));
    setNotice('Review updated.');
  }

  async function remove(item: Testimonial) {
    if (!window.confirm('Permanently delete this review?')) return;
    setBusyId(item.id);
    const result = await deleteTestimonialAction(item.id);
    setBusyId(null);
    if (!result.success) {
      setNotice(result.error || 'Review could not be deleted.');
      return;
    }
    setItems((current) => current.filter((entry) => entry.id !== item.id));
    setNotice('Review deleted.');
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1C2541] pb-3">
        <div className="flex flex-wrap gap-1 rounded-lg border border-[#1C2541] bg-[#111C38] p-1">
          {(['pending', 'approved', 'rejected', 'all'] as const).map((value) => <button key={value} type="button" onClick={() => setFilter(value)} className={`rounded-md px-3 py-1.5 text-[11px] font-bold capitalize ${filter === value ? 'bg-[#48CAE4] text-[#0B132B]' : 'text-slate-400 hover:text-white'}`}>{value}</button>)}
        </div>
        {notice && <p role="status" className="text-xs text-emerald-300">{notice}</p>}
      </div>

      {visibleItems.length === 0 ? <p className="rounded-xl border border-dashed border-[#33415F] px-4 py-10 text-center text-xs text-slate-400">No {filter === 'all' ? '' : `${filter} `}reviews.</p> : (
        <div className="space-y-3">
          {visibleItems.map((item) => (
            <article key={item.id} className="space-y-3 rounded-xl border border-[#25314D] bg-[#111C38] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div><p className="text-xs font-black text-white">{item.author_name} · {item.rating}/5</p><p className="text-[10px] text-slate-500">{new Date(item.created_at).toLocaleString()}</p></div>
                <span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase ${item.status === 'approved' ? 'bg-emerald-400/10 text-emerald-300' : item.status === 'rejected' ? 'bg-rose-400/10 text-rose-300' : 'bg-amber-400/10 text-amber-300'}`}>{item.status}</span>
              </div>
              <textarea aria-label={`Edit review by ${item.author_name}`} defaultValue={item.content} maxLength={1500} minLength={20} rows={3} id={`testimonial-${item.id}`} className="w-full rounded-lg border border-[#34415E] bg-[#0B132B] p-3 text-xs leading-relaxed text-slate-200 outline-none focus:border-[#48CAE4]" />
              <details className="rounded-lg border border-[#25314D] bg-[#0B132B]/60 p-3"><summary className="cursor-pointer text-[11px] font-bold text-[#48CAE4]">Review translations</summary><div className="mt-3 grid gap-3 sm:grid-cols-3">{(['fr', 'es', 'pt'] as const).map((locale) => <label key={locale} className="text-[10px] font-bold uppercase text-slate-400">{locale}<textarea rows={3} maxLength={1500} value={(translations[item.id] || item.translations || {})[locale]?.content || ''} onChange={(event) => setTranslations((current) => ({ ...current, [item.id]: { ...(current[item.id] || item.translations || {}), [locale]: { ...((current[item.id] || item.translations || {})[locale] || {}), content: event.target.value } } }))} className="mt-1 block w-full rounded-md border border-[#34415E] bg-[#111C38] p-2 text-[11px] font-normal normal-case text-white" /></label>)}</div></details>
              <div className="flex flex-wrap items-center gap-2 border-t border-[#25314D] pt-3">
                <label className="mr-auto inline-flex items-center gap-2 text-[11px] text-slate-300"><input type="checkbox" defaultChecked={item.is_featured} disabled={item.status !== 'approved'} id={`featured-${item.id}`} className="accent-amber-300" /><Star className="h-3.5 w-3.5 text-amber-300" /> Featured</label>
                <button type="button" disabled={busyId === item.id} onClick={() => void save(item, 'approved', (document.getElementById(`featured-${item.id}`) as HTMLInputElement).checked, (document.getElementById(`testimonial-${item.id}`) as HTMLTextAreaElement).value)} className="inline-flex min-h-8 items-center gap-1 rounded-lg bg-emerald-400 px-3 text-[10px] font-black text-[#08251D] disabled:opacity-50"><Check className="h-3 w-3" /> Approve / save</button>
                <button type="button" disabled={busyId === item.id} onClick={() => void save(item, 'rejected', false, (document.getElementById(`testimonial-${item.id}`) as HTMLTextAreaElement).value)} className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-rose-400/30 px-3 text-[10px] font-bold text-rose-300 disabled:opacity-50"><X className="h-3 w-3" /> Reject</button>
                <button type="button" disabled={busyId === item.id} onClick={() => void remove(item)} aria-label="Delete review" className="rounded-lg border border-[#34415E] p-2 text-slate-400 hover:text-rose-300 disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
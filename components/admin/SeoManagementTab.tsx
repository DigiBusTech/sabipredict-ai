'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ImagePlus, Save, Upload } from 'lucide-react';
import { savePageSeoAction, uploadManagedImageAction } from '@/app/actions/content-management';
import { PageSeoMetadata } from '@/lib/types';
import { Locale } from '@/lib/i18n/types';

const locales: Locale[] = ['en', 'fr', 'es', 'pt'];
const knownPaths = ['/', '/predictions', '/vip', '/pricing', '/blog', '/testimonials', '/account', '/terms', '/privacy', '/affiliate-policy'];

function emptySeo(path: string): PageSeoMetadata {
  return { path, title: '', description: '', keywords: [], canonical_url: '', open_graph_image_url: '', no_index: ['/account', '/admin'].includes(path), translations: {} };
}

export default function SeoManagementTab({ initialItems }: { initialItems: PageSeoMetadata[] }) {
  const [items, setItems] = useState(() => {
    const paths = [...new Set([...knownPaths, ...initialItems.map((item) => item.path)])];
    return paths.map((path) => initialItems.find((item) => item.path === path) || emptySeo(path));
  });
  const [path, setPath] = useState('/');
  const [locale, setLocale] = useState<Locale>('en');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const current = items.find((item) => item.path === path) || emptySeo(path);
  const localized = current.translations?.[locale] || {};

  function update(patch: Partial<PageSeoMetadata>) {
    setItems((all) => all.map((item) => item.path === path ? { ...item, ...patch } : item));
  }

  function updateLocalized(key: 'title' | 'description', value: string) {
    update({ translations: { ...current.translations, [locale]: { ...localized, [key]: value } } });
  }

  async function uploadOgImage(file?: File) {
    if (!file) return;
    const formData = new FormData();
    formData.set('file', file);
    setBusy(true);
    const result = await uploadManagedImageAction(formData);
    setBusy(false);
    if (!result.success || !result.url) { setNotice(result.error || 'Image upload failed.'); return; }
    update({ open_graph_image_url: result.url });
    setNotice('Open Graph image uploaded. Save SEO settings to publish.');
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const result = await savePageSeoAction({ ...current, keywords: typeof current.keywords === 'string' ? (current.keywords as unknown as string).split(',').map((value) => value.trim()).filter(Boolean) : current.keywords });
    setBusy(false);
    setNotice(result.success ? 'SEO settings saved.' : result.error || 'SEO settings could not be saved.');
  }

  return (
    <form onSubmit={save} className="space-y-5 rounded-xl border border-[#25314D] bg-[#111C38] p-5">
      <header className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-sm font-black text-white">Search and social metadata</h2><p className="mt-1 text-[11px] text-slate-400">Per-route title, description, keywords, canonical URL, and share image.</p></div><div className="flex gap-2"><select value={path} onChange={(event) => setPath(event.target.value)} className="min-h-9 rounded-lg border border-[#34415E] bg-[#0B132B] px-3 text-xs text-white">{items.map((item) => <option key={item.path} value={item.path}>{item.path}</option>)}</select><input aria-label="Add SEO route" placeholder="/new-route" id="seo-new-path" className="min-h-9 w-36 rounded-lg border border-[#34415E] bg-[#0B132B] px-3 text-xs text-white" /><button type="button" onClick={() => { const value = (document.getElementById('seo-new-path') as HTMLInputElement).value.trim(); if (value.startsWith('/') && !items.some((item) => item.path === value)) { setItems((all) => [...all, emptySeo(value)]); setPath(value); } }} className="min-h-9 rounded-lg border border-[#34415E] px-3 text-xs font-bold text-slate-200">Add route</button></div></header>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-bold text-slate-300">Default title<input maxLength={180} value={current.title} onChange={(event) => update({ title: event.target.value })} className="mt-1.5 min-h-10 w-full rounded-lg border border-[#34415E] bg-[#0B132B] px-3 text-sm text-white" /></label>
        <label className="text-xs font-bold text-slate-300">Locale override<select value={locale} onChange={(event) => setLocale(event.target.value as Locale)} className="mt-1.5 min-h-10 w-full rounded-lg border border-[#34415E] bg-[#0B132B] px-3 text-sm text-white">{locales.map((item) => <option key={item} value={item}>{item.toUpperCase()}</option>)}</select></label>
        <label className="text-xs font-bold text-slate-300 sm:col-span-2">Localized title<input maxLength={180} value={localized.title || ''} onChange={(event) => updateLocalized('title', event.target.value)} placeholder={`${locale.toUpperCase()} title override (optional)`} className="mt-1.5 min-h-10 w-full rounded-lg border border-[#34415E] bg-[#0B132B] px-3 text-sm text-white" /></label>
        <label className="text-xs font-bold text-slate-300 sm:col-span-2">Description<textarea maxLength={320} rows={3} value={current.description} onChange={(event) => update({ description: event.target.value })} className="mt-1.5 w-full rounded-lg border border-[#34415E] bg-[#0B132B] p-3 text-sm text-white" /></label>
        <label className="text-xs font-bold text-slate-300 sm:col-span-2">Localized description<textarea maxLength={320} rows={2} value={localized.description || ''} onChange={(event) => updateLocalized('description', event.target.value)} placeholder={`${locale.toUpperCase()} description override (optional)`} className="mt-1.5 w-full rounded-lg border border-[#34415E] bg-[#0B132B] p-3 text-sm text-white" /></label>
        <label className="text-xs font-bold text-slate-300 sm:col-span-2">Keywords, comma-separated<input value={current.keywords.join(', ')} onChange={(event) => update({ keywords: event.target.value.split(',').map((keyword) => keyword.trim()) })} className="mt-1.5 min-h-10 w-full rounded-lg border border-[#34415E] bg-[#0B132B] px-3 text-sm text-white" /></label>
        <label className="text-xs font-bold text-slate-300 sm:col-span-2">Canonical URL<input value={current.canonical_url || ''} onChange={(event) => update({ canonical_url: event.target.value })} placeholder="https://example.com/path" className="mt-1.5 min-h-10 w-full rounded-lg border border-[#34415E] bg-[#0B132B] px-3 text-sm text-white" /></label>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
        <div className="space-y-2"><label className="block text-xs font-bold text-slate-300">Open Graph image URL<input value={current.open_graph_image_url || ''} onChange={(event) => update({ open_graph_image_url: event.target.value })} placeholder="https://..." className="mt-1.5 min-h-10 w-full rounded-lg border border-[#34415E] bg-[#0B132B] px-3 text-sm text-white" /></label><label className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-lg border border-[#34415E] px-3 text-xs font-bold text-slate-200 hover:border-[#48CAE4]"><Upload className="h-3.5 w-3.5" />Upload image<input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={(event) => void uploadOgImage(event.target.files?.[0])} className="sr-only" /></label></div>
        <div className="relative aspect-video overflow-hidden rounded-lg border border-[#34415E] bg-[#0B132B]">{current.open_graph_image_url ? <Image unoptimized fill src={current.open_graph_image_url} alt="Open Graph preview" className="object-cover" /> : <div className="flex h-full items-center justify-center text-slate-600"><ImagePlus className="h-6 w-6" /></div>}</div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#25314D] pt-4"><label className="inline-flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" checked={current.no_index} onChange={(event) => update({ no_index: event.target.checked })} className="accent-amber-400" />No index / no follow</label><div className="flex items-center gap-3">{notice && <p role="status" className="text-xs text-emerald-300">{notice}</p>}<button type="submit" disabled={busy} className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-[#48CAE4] px-4 text-xs font-black text-[#0B132B] disabled:opacity-50"><Save className="h-3.5 w-3.5" />Save SEO</button></div></div>
    </form>
  );
}
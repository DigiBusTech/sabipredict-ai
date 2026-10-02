'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ImagePlus, Plus, Save, Trash2, Upload } from 'lucide-react';
import { saveHomepageContentAction, savePromoSlotAction, deletePromoSlotAction, uploadManagedImageAction } from '@/app/actions/content-management';
import { HomepageContent, HomepageCopy, PromoSlot } from '@/lib/types';
import { Locale } from '@/lib/i18n/types';

const locales: Locale[] = ['en', 'fr', 'es', 'pt'];
const emptyCopy: HomepageCopy = { eyebrow: '', headline: '', headline_highlight: '', description: '', accuracy_label: '', verified_label: '', banker_label: '' };

export default function ContentManagementTab({ initialContent, initialPromos }: { initialContent: HomepageContent; initialPromos: PromoSlot[] }) {
  const [content, setContent] = useState(initialContent);
  const [locale, setLocale] = useState<Locale>('en');
  const [promos, setPromos] = useState(initialPromos);
  const [editingPromo, setEditingPromo] = useState<Partial<PromoSlot> | null>(null);
  const [promoLocale, setPromoLocale] = useState<Locale>('en');
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const localizedCopy = { ...emptyCopy, ...(content.translations[locale] || {}) };
  function changeCopy(key: keyof HomepageCopy, value: string) {
    setContent((current) => ({ ...current, translations: { ...current.translations, [locale]: { ...current.translations[locale], [key]: value } } }));
  }

  async function uploadHero(file?: File) {
    if (!file) return;
    setBusy(true);
    const formData = new FormData();
    formData.set('file', file);
    const result = await uploadManagedImageAction(formData);
    setBusy(false);
    if (!result.success || !result.url) { setNotice(result.error || 'Hero image upload failed.'); return; }
    setContent((current) => ({ ...current, hero_image_url: result.url! }));
    setNotice('Hero image uploaded. Save homepage content to publish it.');
  }

  async function saveHomepage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const result = await saveHomepageContentAction(content);
    setBusy(false);
    setNotice(result.success ? 'Homepage content saved.' : result.error || 'Homepage content could not be saved.');
  }

  async function savePromo(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = String(formData.get('title') || '').trim();
    const body = String(formData.get('body') || '').trim();
    const cta = String(formData.get('cta') || '').trim();
    const translations = { ...(editingPromo?.translations || {}), [promoLocale]: { title, body, cta } };
    const result = await savePromoSlotAction({
      ...editingPromo,
      name: String(formData.get('name') || ''),
      placement: String(formData.get('placement')) as PromoSlot['placement'],
      image_url: String(formData.get('image_url') || ''),
      target_url: String(formData.get('target_url') || ''),
      starts_at: String(formData.get('starts_at') || '') || null,
      ends_at: String(formData.get('ends_at') || '') || null,
      is_active: formData.get('is_active') === 'true',
      sort_order: Number(formData.get('sort_order') || 0),
      translations,
    });
    if (!result.success) { setNotice(result.error || 'Promotion could not be saved.'); return; }
    setEditingPromo(null);
    setNotice('Promotion saved.');
    window.location.reload();
  }

  async function uploadPromoImage(file?: File) {
    if (!file || !editingPromo) return;
    const formData = new FormData();
    formData.set('file', file);
    setBusy(true);
    const result = await uploadManagedImageAction(formData);
    setBusy(false);
    if (!result.success || !result.url) { setNotice(result.error || 'Promotion image upload failed.'); return; }
    setEditingPromo((current) => current ? { ...current, image_url: result.url } : current);
    setNotice('Promotion image uploaded. Save the promotion to publish it.');
  }

  async function removePromo(id: string) {
    if (!window.confirm('Delete this promotion?')) return;
    const result = await deletePromoSlotAction(id);
    if (!result.success) { setNotice(result.error || 'Promotion could not be deleted.'); return; }
    setPromos((current) => current.filter((promo) => promo.id !== id));
    setNotice('Promotion deleted.');
  }

  return (
    <div className="space-y-8">
      <form onSubmit={saveHomepage} className="space-y-5 rounded-xl border border-[#25314D] bg-[#111C38] p-5">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-sm font-black text-white">Homepage content</h2><p className="mt-1 text-[11px] text-slate-400">Manage hero copy and imagery per language.</p></div><select value={locale} onChange={(event) => setLocale(event.target.value as Locale)} className="min-h-9 rounded-lg border border-[#34415E] bg-[#0B132B] px-3 text-xs text-white">{locales.map((item) => <option key={item} value={item}>{item.toUpperCase()}</option>)}</select></div>
        <div className="grid gap-3 sm:grid-cols-2">
          {([
            ['eyebrow', 'Eyebrow'], ['headline', 'Headline'], ['headline_highlight', 'Headline highlight'],
            ['accuracy_label', 'Accuracy stat'], ['verified_label', 'Verified stat'], ['banker_label', 'Banker stat'],
          ] as const).map(([key, label]) => <label key={key} className="text-[11px] font-bold text-slate-300">{label}<input maxLength={160} value={localizedCopy[key]} onChange={(event) => changeCopy(key, event.target.value)} className="mt-1 block min-h-10 w-full rounded-lg border border-[#34415E] bg-[#0B132B] px-3 text-xs text-white" /></label>)}
        </div>
        <label className="block text-[11px] font-bold text-slate-300">Description<textarea maxLength={500} rows={3} value={localizedCopy.description} onChange={(event) => changeCopy('description', event.target.value)} className="mt-1 block w-full rounded-lg border border-[#34415E] bg-[#0B132B] p-3 text-xs text-white" /></label>
        <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
          <div className="space-y-2"><label className="block text-[11px] font-bold text-slate-300">Hero image URL<input value={content.hero_image_url} onChange={(event) => setContent((current) => ({ ...current, hero_image_url: event.target.value }))} placeholder="https://..." className="mt-1 block min-h-10 w-full rounded-lg border border-[#34415E] bg-[#0B132B] px-3 text-xs text-white" /></label><label className="block text-[11px] font-bold text-slate-300">Image alt text<input value={content.hero_image_alt[locale] || ''} onChange={(event) => setContent((current) => ({ ...current, hero_image_alt: { ...current.hero_image_alt, [locale]: event.target.value } }))} className="mt-1 block min-h-10 w-full rounded-lg border border-[#34415E] bg-[#0B132B] px-3 text-xs text-white" /></label><label className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-lg border border-[#34415E] px-3 text-xs font-bold text-slate-200 hover:border-[#48CAE4]"><Upload className="h-3.5 w-3.5 text-[#48CAE4]" />{busy ? 'Uploading...' : 'Upload image'}<input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={(event) => void uploadHero(event.target.files?.[0])} className="sr-only" /></label></div>
          <div className="relative aspect-video overflow-hidden rounded-lg border border-[#34415E] bg-[#0B132B]">{content.hero_image_url ? <Image unoptimized fill src={content.hero_image_url} alt={content.hero_image_alt[locale] || ''} className="object-cover" /> : <div className="flex h-full items-center justify-center text-slate-600"><ImagePlus className="h-6 w-6" /></div>}</div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#25314D] pt-4">{notice && <p role="status" className="text-xs text-emerald-300">{notice}</p>}<button type="submit" disabled={busy} className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-[#48CAE4] px-4 text-xs font-black text-[#0B132B] disabled:opacity-50"><Save className="h-3.5 w-3.5" />Save homepage</button></div>
      </form>

      <section className="space-y-4 rounded-xl border border-[#25314D] bg-[#111C38] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-sm font-black text-white">Promotion placements</h2><p className="mt-1 text-[11px] text-slate-400">Scheduled cards appear only during their active window.</p></div><button type="button" onClick={() => { setPromoLocale('en'); setEditingPromo({ name: '', placement: 'home-feed', is_active: false, sort_order: 0, translations: {} }); }} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[#34415E] px-3 text-xs font-bold text-slate-200 hover:border-[#48CAE4]"><Plus className="h-3.5 w-3.5" />New promotion</button></div>
        {promos.map((promo) => <article key={promo.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#25314D] bg-[#0B132B] p-3"><div><p className="text-xs font-bold text-white">{promo.name}</p><p className="mt-1 text-[10px] text-slate-500">{promo.placement} · {promo.is_active ? 'active' : 'inactive'}{promo.starts_at ? ` · from ${new Date(promo.starts_at).toLocaleDateString()}` : ''}</p></div><div className="flex gap-2"><button type="button" onClick={() => { setPromoLocale('en'); setEditingPromo(promo); }} className="min-h-8 rounded-lg border border-[#34415E] px-3 text-[10px] font-bold text-slate-300">Edit</button><button type="button" onClick={() => void removePromo(promo.id)} aria-label="Delete promotion" className="rounded-lg border border-[#34415E] p-2 text-slate-400 hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button></div></article>)}
        {promos.length === 0 && <p className="rounded-lg border border-dashed border-[#34415E] px-4 py-6 text-center text-xs text-slate-500">No promotions configured.</p>}
        {editingPromo && <form onSubmit={savePromo} className="grid gap-3 rounded-lg border border-[#34415E] bg-[#0B132B] p-4 sm:grid-cols-2">
          <label className="text-[10px] font-bold text-slate-400">Campaign name<input name="name" required defaultValue={editingPromo.name} className="mt-1 block min-h-9 w-full rounded-md border border-[#34415E] bg-[#111C38] px-2 text-xs text-white" /></label>
          <label className="text-[10px] font-bold text-slate-400">Placement<select name="placement" defaultValue={editingPromo.placement || 'home-feed'} className="mt-1 block min-h-9 w-full rounded-md border border-[#34415E] bg-[#111C38] px-2 text-xs text-white"><option value="home-hero">Homepage hero</option><option value="home-feed">Homepage feed</option><option value="blog-sidebar">Blog sidebar</option><option value="pricing-banner">Pricing banner</option></select></label>
          <label className="text-[10px] font-bold text-slate-400">Locale<select value={promoLocale} onChange={(event) => setPromoLocale(event.target.value as Locale)} className="mt-1 block min-h-9 w-full rounded-md border border-[#34415E] bg-[#111C38] px-2 text-xs text-white">{locales.map((item) => <option key={item} value={item}>{item.toUpperCase()}</option>)}</select></label>
          <label className="text-[10px] font-bold text-slate-400">Image URL<input name="image_url" value={editingPromo.image_url || ''} onChange={(event) => setEditingPromo((current) => current ? { ...current, image_url: event.target.value } : current)} className="mt-1 block min-h-9 w-full rounded-md border border-[#34415E] bg-[#111C38] px-2 text-xs text-white" /></label>
          <label className="inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-[#34415E] px-3 text-[10px] font-bold text-slate-200 hover:border-[#48CAE4]"><Upload className="h-3.5 w-3.5" />{busy ? 'Uploading...' : 'Upload artwork'}<input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={(event) => void uploadPromoImage(event.target.files?.[0])} className="sr-only" /></label>
          <label className="text-[10px] font-bold text-slate-400">Target URL<input name="target_url" defaultValue={editingPromo.target_url || ''} placeholder="https://..." className="mt-1 block min-h-9 w-full rounded-md border border-[#34415E] bg-[#111C38] px-2 text-xs text-white" /></label>
          <label className="text-[10px] font-bold text-slate-400">Sort order<input name="sort_order" type="number" defaultValue={editingPromo.sort_order || 0} className="mt-1 block min-h-9 w-full rounded-md border border-[#34415E] bg-[#111C38] px-2 text-xs text-white" /></label>
          <label className="text-[10px] font-bold text-slate-400">Starts<input name="starts_at" type="datetime-local" defaultValue={editingPromo.starts_at?.slice(0, 16) || ''} className="mt-1 block min-h-9 w-full rounded-md border border-[#34415E] bg-[#111C38] px-2 text-xs text-white" /></label>
          <label className="text-[10px] font-bold text-slate-400">Ends<input name="ends_at" type="datetime-local" defaultValue={editingPromo.ends_at?.slice(0, 16) || ''} className="mt-1 block min-h-9 w-full rounded-md border border-[#34415E] bg-[#111C38] px-2 text-xs text-white" /></label>
          <label className="text-[10px] font-bold text-slate-400 sm:col-span-2">Title<input name="title" defaultValue={editingPromo.translations?.[promoLocale]?.title || ''} className="mt-1 block min-h-9 w-full rounded-md border border-[#34415E] bg-[#111C38] px-2 text-xs text-white" /></label>
          <label className="text-[10px] font-bold text-slate-400 sm:col-span-2">Body<textarea name="body" rows={2} defaultValue={editingPromo.translations?.[promoLocale]?.body || ''} className="mt-1 block w-full rounded-md border border-[#34415E] bg-[#111C38] p-2 text-xs text-white" /></label>
          <label className="text-[10px] font-bold text-slate-400">Call to action<input name="cta" defaultValue={editingPromo.translations?.[promoLocale]?.cta || ''} className="mt-1 block min-h-9 w-full rounded-md border border-[#34415E] bg-[#111C38] px-2 text-xs text-white" /></label>
          <label className="inline-flex items-center gap-2 self-end text-xs text-slate-300"><input name="is_active" type="checkbox" value="true" defaultChecked={editingPromo.is_active} className="accent-[#48CAE4]" />Active</label>
          <div className="flex justify-end gap-2 border-t border-[#25314D] pt-3 sm:col-span-2"><button type="button" onClick={() => setEditingPromo(null)} className="min-h-9 rounded-md border border-[#34415E] px-3 text-xs text-slate-300">Cancel</button><button type="submit" className="min-h-9 rounded-md bg-[#48CAE4] px-4 text-xs font-black text-[#0B132B]">Save promotion</button></div>
        </form>}
      </section>
    </div>
  );
}
import Image from 'next/image';
import Link from 'next/link';
import { PromoSlot } from '@/lib/types';
import { Locale } from '@/lib/i18n/types';

export default function PromoSlotCard({ slot, locale }: { slot: PromoSlot; locale: Locale }) {
  const copy = slot.translations[locale] || slot.translations.en || {};
  const content = (
    <div className="flex min-h-24 flex-col justify-end overflow-hidden rounded-xl border border-[#34415E] bg-[#111C38] p-4 sm:min-h-32 sm:p-5">
      {slot.image_url && <Image unoptimized fill src={slot.image_url} alt={copy.title || slot.name} className="-z-20 object-cover" />}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-r from-[#08111F]/95 via-[#08111F]/75 to-[#08111F]/20" />
      <div className="relative z-10 max-w-2xl">
        <p className="text-[9px] font-black uppercase tracking-wider text-[#48CAE4]">Promotion</p>
        {copy.title && <h3 className="mt-1 text-sm font-black text-white sm:text-base">{copy.title}</h3>}
        {copy.body && <p className="mt-1 text-xs leading-relaxed text-slate-200">{copy.body}</p>}
        {copy.cta && <span className="mt-2 inline-flex min-h-8 items-center rounded-md bg-[#48CAE4] px-3 text-[10px] font-black text-[#0B132B]">{copy.cta}</span>}
      </div>
    </div>
  );

  if (!slot.target_url) return <aside className="relative">{content}</aside>;
  const external = slot.target_url.startsWith('https://');
  return external
    ? <a className="relative block transition hover:-translate-y-0.5" href={slot.target_url} target="_blank" rel="noopener noreferrer">{content}</a>
    : <Link className="relative block transition hover:-translate-y-0.5" href={slot.target_url}>{content}</Link>;
}

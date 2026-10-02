import { notFound } from 'next/navigation';
import { getPolicyPage } from '@/lib/growth';
import { PolicyPage } from '@/lib/types';
import { getRequestLocale } from '@/lib/i18n/server';

export default async function PolicyPageView({ slug }: { slug: PolicyPage['slug'] }) {
  const locale = await getRequestLocale();
  const page = await getPolicyPage(slug, locale);
  if (!page) notFound();

  return (
    <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="text-[10px] font-black uppercase tracking-wider text-[#48CAE4]">SabiPredict AI policies</p>
      <h1 className="mt-2 text-3xl font-black text-white">{page.title}</h1>
      <p className="mt-2 text-[10px] text-slate-500">Updated {new Date(page.updated_at).toLocaleDateString()}</p>
      <div className="mt-8 min-h-40 whitespace-pre-wrap rounded-xl border border-[#25314D] bg-[#111C38] p-5 text-sm leading-relaxed text-slate-300">{page.content || 'This policy page is being prepared.'}</div>
    </article>
  );
}
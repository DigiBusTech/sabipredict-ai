import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUserProfile } from '@/lib/db';
import { getAffiliateDashboard, hasActiveVipMembership } from '@/lib/growth';
import AffiliateDashboard from '@/components/AffiliateDashboard';

export const metadata = {
  title: 'Affiliate Program | SabiPredict AI',
  description: 'Share SabiPredict AI and track commissions from verified referred subscriptions.',
};

export default async function AffiliatePage() {
  const profile = await getCurrentUserProfile();
  if (!profile) redirect('/login?redirect=/vip/affiliate');

  const isActiveVip = hasActiveVipMembership(profile);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <header className="max-w-2xl space-y-2">
        <p className="text-[10px] font-black uppercase tracking-wider text-[#48CAE4]">Member referral program</p>
        <h1 className="text-3xl font-black text-white">Share SabiPredict AI</h1>
        <p className="text-sm leading-relaxed text-slate-400">Refer new members and receive a disclosed commission when their eligible subscription payment is verified.</p>
      </header>
      {isActiveVip ? (
        <AffiliateDashboard data={await getAffiliateDashboard(profile.id)} />
      ) : (
        <section className="max-w-2xl space-y-4 rounded-xl border border-[#25314D] bg-[#111C38] p-6">
          <h2 className="text-base font-black text-white">Active VIP membership required</h2>
          <p className="text-sm leading-relaxed text-slate-300">The referral dashboard is available to members with an active VIP subscription. Referral commissions are paid only on verified subscription sales and are not guaranteed.</p>
          <Link href="/pricing" className="inline-flex min-h-10 items-center rounded-lg bg-[#48CAE4] px-4 text-xs font-black text-[#0B132B]">View membership plans</Link>
        </section>
      )}
    </div>
  );
}